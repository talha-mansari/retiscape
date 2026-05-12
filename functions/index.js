const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const { defineSecret } = require("firebase-functions/params");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const Anthropic = require("@anthropic-ai/sdk");
const { SpeechClient } = require("@google-cloud/speech");
const Stripe = require("stripe");

initializeApp();
setGlobalOptions({ maxInstances: 10 });

const ANTHROPIC_API_KEY      = defineSecret("ANTHROPIC_API_KEY");
const STRIPE_SECRET_KEY      = defineSecret("STRIPE_SECRET_KEY");
const STRIPE_PUBLISHABLE_KEY = defineSecret("STRIPE_PUBLISHABLE_KEY");
const STRIPE_PRICE_ID        = defineSecret("STRIPE_PRICE_ID");
const STRIPE_WEBHOOK_SECRET  = defineSecret("STRIPE_WEBHOOK_SECRET");

const SYSTEM_PROMPT = `You are a project tracker assistant. The user tracks multiple "areas" (e.g. "Job Search", "Health", "Side Project"). Each area has a progress timeline of events and a list of next steps.

The user's input may be a short casual update ("met with Dr. Angell today") or a long-form project status document. In either case, read the content and use your judgment to determine what actions to take:
- Things that have been accomplished or completed → add_event actions
- Things that are pending, in progress, or should be tracked as a next action → add_step actions

Rules:
- Infer the correct area from the message content and area labels. Be confident when it's clear.
- If the update clearly spans multiple areas or you genuinely cannot tell, set needsAreaSelection to true and list the candidate area IDs.
- Dates default to today (${new Date().toISOString().slice(0, 10)}) unless the user specifies otherwise.
- Only create a new area if the user explicitly says they want a new one.
- Keep event titles concise (5-10 words). Put detail in description.
- For long documents, generate as many actions as needed to capture everything meaningful — do not truncate.
- Return ONLY valid JSON, no prose.

Output schema:
{
  "needsAreaSelection": false,
  "candidates": [],
  "actions": [
    // one of:
    { "type": "add_event",     "areaId": "...", "title": "...", "date": "YYYY-MM-DD", "description": "..." }
    { "type": "add_step",      "areaId": "...", "text": "..." }
    { "type": "complete_step", "areaId": "...", "stepIndex": 0, "eventTitle": "...", "eventDate": "YYYY-MM-DD", "eventDescription": "..." }
    { "type": "remove_step",   "areaId": "...", "stepIndex": 0 }
    { "type": "create_area",   "label": "..." }
  ],
  "summary": "One sentence describing what was done."
}

When needsAreaSelection is true, actions should still be fully formed — just missing the areaId which the user will fill in.`;

exports.processUpdate = onCall({ cors: true, secrets: [ANTHROPIC_API_KEY] }, async (request) => {
  const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY.value() });
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in required.");

  await checkPro(uid);

  const { message, projectState } = request.data;
  if (!message?.trim()) throw new HttpsError("invalid-argument", "Message is required.");

  const { areas = {}, customAreas = [] } = projectState || {};

  const stateContext = customAreas.map(area => ({
    id: area.id,
    label: area.label,
    events: (areas[area.id]?.events || []).slice(-5).map(e => ({ title: e.title, date: e.date })),
    nextSteps: (areas[area.id]?.nextSteps || []).filter(Boolean),
  }));

  const userMessage = `Current project state:\n${JSON.stringify(stateContext, null, 2)}\n\nUser update:\n${message.trim()}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const raw = response.content[0]?.text?.trim() || "{}";
  // Strip markdown code fences if present
  const jsonText = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");

  let result;
  try {
    result = JSON.parse(jsonText);
  } catch {
    throw new HttpsError("invalid-argument", "Couldn't interpret that as a tracker update. Try describing a specific event or action (e.g. 'Met with Dr. Angell today about the pilot').");
  }

  return result;
});

async function checkPro(uid) {
  const db = getFirestore();
  const snap = await db.doc(`users/${uid}`).get();
  if (!snap.data()?.isPro) throw new HttpsError("permission-denied", "Pro subscription required.");
}

exports.transcribeAudio = onCall({ cors: true, timeoutSeconds: 300 }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in required.");
  await checkPro(uid);

  const { audioBase64, mimeType } = request.data;
  if (!audioBase64) throw new HttpsError("invalid-argument", "Audio data is required.");

  let encoding = "WEBM_OPUS";
  if (mimeType?.includes("ogg")) encoding = "OGG_OPUS";
  else if (mimeType?.includes("mp4") || mimeType?.includes("m4a")) encoding = "MP4";

  const client = new SpeechClient();
  const [operation] = await client.longRunningRecognize({
    audio: { content: audioBase64 },
    config: {
      encoding,
      languageCode: "en-US",
      enableAutomaticPunctuation: true,
    },
  });
  const [response] = await operation.promise();

  const transcript = (response.results || [])
    .map(r => r.alternatives?.[0]?.transcript || "")
    .join(" ")
    .trim();

  return { transcript };
});

// ── createCheckoutSession ─────────────────────────────────────────────────────
exports.createCheckoutSession = onCall(
  { cors: true, secrets: [STRIPE_SECRET_KEY, STRIPE_PRICE_ID] },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "Sign in required.");

    const stripe = new Stripe(STRIPE_SECRET_KEY.value());
    const { successUrl, cancelUrl } = request.data;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: STRIPE_PRICE_ID.value(), quantity: 1 }],
      client_reference_id: uid,
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return { url: session.url };
  }
);

// ── stripeWebhook ─────────────────────────────────────────────────────────────
exports.stripeWebhook = onRequest(
  { cors: false, secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET] },
  async (req, res) => {
    if (req.method !== "POST") { res.status(405).send("Method not allowed"); return; }

    const sig = req.headers["stripe-signature"];
    let event;
    try {
      const stripe = new Stripe(STRIPE_SECRET_KEY.value());
      event = stripe.webhooks.constructEvent(req.rawBody, sig, STRIPE_WEBHOOK_SECRET.value());
    } catch (err) {
      res.status(400).send(`Webhook error: ${err.message}`);
      return;
    }

    const db = getFirestore();

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const uid = session.client_reference_id;
      if (uid) {
        await db.doc(`users/${uid}`).set(
          { isPro: true, stripeCustomerId: session.customer },
          { merge: true }
        );
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const customerId = event.data.object.customer;
      const snap = await db.collection("users").where("stripeCustomerId", "==", customerId).limit(1).get();
      if (!snap.empty) await snap.docs[0].ref.update({ isPro: false });
    }

    res.json({ received: true });
  }
);
