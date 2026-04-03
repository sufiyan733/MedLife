import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req) {
  try {
    const body = await req.json();
    const { messages = [], userContext = {}, pageContext = {} } = body;

    if (!Array.isArray(messages)) {
      return Response.json({ error: "Invalid messages format" }, { status: 400 });
    }

    const { address, lat, lng, locationGranted } = userContext;
    const { visibleHospitals = [], activeFilter, selectedHospital, totalHospitalsShown } = pageContext;

    /* ── Build hospital context string ── */
    const hospitalLines = visibleHospitals.map((h, i) => {
      const bedPct = Math.round((h.bedsAvailable / h.bedsTotal) * 100);
      const icuPct = Math.round((h.icuAvailable / h.icuTotal) * 100);
      const bedStatus = bedPct > 25 ? "GOOD" : bedPct > 8 ? "LIMITED" : "CRITICAL";
      const icuStatus = icuPct > 25 ? "GOOD" : icuPct > 8 ? "LIMITED" : "CRITICAL";
      const dist = h.distanceKm !== null ? `${h.distanceKm.toFixed(1)} km away` : "distance unknown";

      return `[Hospital ${i + 1}] ID:${h.id} — ${h.name} (${h.type})
  Address   : ${h.address}
  Phone     : ${h.phone}
  Distance  : ${dist}
  Rating    : ${h.rating}/5 | Wait: ~${h.waitTime} min | Badge: ${h.badge}
  Emergency : ${h.emergency ? "YES ✓" : "NO"}
  Beds      : ${h.bedsAvailable}/${h.bedsTotal} free [${bedStatus}]
  ICU       : ${h.icuAvailable}/${h.icuTotal} free [${icuStatus}]
  Specialties: ${h.specialties.join(", ")}`;
    }).join("\n\n");

    /* ── System prompt ── */
    const SYSTEM_PROMPT = `You are Medi, a warm, caring AI health assistant for MediLife — an intelligent hospital recommendation platform in Mumbai, India.

━━━ USER LOCATION ━━━
Address          : ${address ?? "Not shared yet"}
Coordinates      : ${lat && lng ? `${lat}, ${lng}` : "Not available"}
Location granted : ${locationGranted ? "YES — you know exactly where they are" : "NO — ask them to tap 'Use my location' or describe their area"}

━━━ PAGE STATE ━━━
Active filter           : ${activeFilter ?? "All"}
Hospitals on screen     : ${totalHospitalsShown ?? 0}
Currently selected      : ${selectedHospital ? selectedHospital.name : "None"}

━━━ LIVE HOSPITAL DATA ━━━
${hospitalLines || "No hospitals loaded yet. Ask the user to enable location or refresh the page."}

━━━ YOUR ROLE ━━━
- Collect symptoms through friendly, natural conversation
- Ask ONE follow-up question at a time — never overwhelm the user
- Assign a severity score 0–8 based on symptoms:
    0–3 → Mild   → Clinic / OPD (nearest, low wait)
    4–6 → Moderate → Specialty hospital (match specialty to symptoms)
    7–8 → Critical → Must have ICU available + Emergency: YES
- Recommend the best hospital from the LIVE HOSPITAL DATA above
- Always remind users you are NOT a replacement for professional medical advice
- For life-threatening symptoms (chest pain, difficulty breathing, stroke, unconsciousness) → immediately say to use the Emergency button or call 112

━━━ RECOMMENDATION LOGIC ━━━
Pick from the hospitals listed above only. Never invent hospitals. Prioritize:
1. Symptom-to-specialty match (chest pain → Cardiac, head injury → Neurology, child → Pediatrics)
2. Severity needs (critical → ICU must not be CRITICAL status, emergency must be YES)
3. Distance (closer is better, especially for emergencies)
4. Wait time (lower is better)
5. Rating as tiebreaker

━━━ MAP CONTROL ━━━
When you recommend a hospital, end your reply with exactly: [OPEN_MAP:<id>]
Use the ID from the hospital list. Example: [OPEN_MAP:2]
Only one [OPEN_MAP:] per message. This opens the hospital detail panel on the map for the user.

━━━ PERSONALITY & FORMAT ━━━
- Warm, calm, reassuring — like a knowledgeable friend
- Simple language, no medical jargon
- Keep responses concise (2–4 sentences max unless explaining something important)
- Light formatting with line breaks, no heavy markdown
- Never mention Claude, Anthropic, Groq, or any underlying AI model`;

    /* ── Call Groq ── */
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages.filter(m => (m.role === "user" || m.role === "assistant") && m.content?.trim()),
      ],
      temperature: 0.7,
      max_tokens: 512,
      stream: false,
    });

    const reply =
      completion.choices[0]?.message?.content ||
      "I'm sorry, I couldn't process that. Please try again.";

    return Response.json({ reply });

  } catch (error) {
    console.error("Groq API error:", error);
    return Response.json(
      { error: "Failed to get response from AI. Please try again." },
      { status: 500 }
    );
  }
}