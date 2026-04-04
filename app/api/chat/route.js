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

    /* ── Compact hospital context (top 3 only, minimal fields) ── */
    const hospitalLines = visibleHospitals.slice(0, 3).map((h, i) => {
      const bedPct = Math.round((h.bedsAvailable / h.bedsTotal) * 100);
      const icuPct = Math.round((h.icuAvailable / h.icuTotal) * 100);
      const bedStatus = bedPct > 25 ? "OK" : bedPct > 8 ? "LOW" : "CRIT";
      const icuStatus = icuPct > 25 ? "OK" : icuPct > 8 ? "LOW" : "CRIT";
      const dist = h.distanceKm !== null ? `${h.distanceKm.toFixed(1)}km` : "?km";
      return `[H${i + 1}] ID:${h.id} ${h.name} (${h.type}) | ${dist} | Wait:${h.waitTime}m | Rating:${h.rating} | ER:${h.emergency ? "Y" : "N"} | Beds:${h.bedsAvailable}/${h.bedsTotal}[${bedStatus}] | ICU:${h.icuAvailable}/${h.icuTotal}[${icuStatus}] | ${h.specialties.slice(0, 3).join(",")}`;
    }).join("\n");

    /* ── Compact system prompt ── */
    const SYSTEM_PROMPT = `"You are Medi, a smart hospital assistant. STRICT RULES: 1) ALWAYS write in English letters/Roman script only — NEVER use Devanagari or any other script. 2) Detect the user's language from their message — if they write in Hindi/Hinglish , reply in Hinglish. If they write in English, reply in English. 3) Match the user's tone — casual if they are casual, serious if they describe symptoms. 4) You are a hospital assistant — gently steer every conversation toward understanding their health issue and recommending a nearby hospital. If user greets you, greet back warmly then ask about their health. 5) When you have enough symptom info and a suitable hospital exists, embed [OPEN_MAP:hospitalId] in your reply. 6) Keep replies short, warm, and conversational. Never write in Devanagari script under any circumstance."

USER: ${address ?? "location unknown"} ${lat && lng ? `(${lat},${lng})` : ""} | Location:${locationGranted ? "YES" : "NO"}
FILTER:${activeFilter ?? "All"} | Hospitals shown:${totalHospitalsShown ?? 0} | Selected:${selectedHospital?.name ?? "none"}

HOSPITALS:
${hospitalLines || "No hospitals loaded."}

RULES:
- Ask ONE symptom question at a time
- Severity 0-3=Mild(clinic), 4-6=Moderate(specialty), 7-8=Critical(ICU+ER required)
- Dont recommend hospitals with following issues: 1- Address not mentioned. 2- Hospital named "Hospital"
- Recommend only from hospitals above, never invent
- Match specialty to symptom (chest→Cardiac, child→Pediatrics, head→Neurology)
- Critical: ICU must not be CRIT, ER must be Y
- Prefer closer + lower wait + higher rating
- If user say show me another or dusra dikhao in hindi so directly open another existing hospital without asking symptoms again
- For chest pain/breathing/stroke/unconscious → show user most optimal hospital immediately without asking symptoms, as these are critical emergencies
- End recommendation with exactly: [OPEN_MAP:<id>]
- Keep replies to 2-3 lines, no bullshit,direct on topic , warm tone
- Never mention Claude, Anthropic, Groq, or any AI model`;

    /* ── Trim to last 4 messages only ── */
    const trimmedMessages = messages
      .filter(m => (m.role === "user" || m.role === "assistant") && m.content?.trim())
      .slice(-4);

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...trimmedMessages,
      ],
      temperature: 0.7,
      max_tokens: 1000,
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