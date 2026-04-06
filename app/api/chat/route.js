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

    /* ── Compact hospital data — pipe-separated, minimal tokens ── */
    const status = (a, t) => { const p = a / t * 100; return p > 25 ? "OK" : p > 8 ? "LO" : "CR"; };
    const hospitalLines = visibleHospitals.slice(0, 5).map((h, i) =>
      `H${i + 1}|${h.id}|${h.name}|${h.distanceKm != null ? h.distanceKm.toFixed(1) + "km" : "?"}|w${h.waitTime}m|r${h.rating}|${h.emergency ? "ER" : "no"}|B${h.bedsAvailable}/${h.bedsTotal}[${status(h.bedsAvailable, h.bedsTotal)}]|I${h.icuAvailable}/${h.icuTotal}[${status(h.icuAvailable, h.icuTotal)}]|${(h.specialties || []).slice(0, 3).join(",")}`
    ).join("\n");

    const SYSTEM_PROMPT = `You are Medi, MediLife's hospital assistant. Smart, warm, direct.

LANG: Match user's language. Hindi/Hinglish→Hinglish (Roman only, NEVER Devanagari). English→English.
TONE: Casual=casual, serious symptoms=urgent+direct.

LOC: ${address ?? "unknown"}${lat && lng ? ` (${lat.toFixed(3)},${lng.toFixed(3)})` : ""} granted:${locationGranted ? "Y" : "N"}
FILTER:${activeFilter ?? "All"} SHOWN:${totalHospitalsShown ?? 0} SELECTED:${selectedHospital?.name ?? "none"}

HOSPITALS:
${hospitalLines || "none loaded"}

COMMANDS (append at end of reply, stripped before showing user):
[OPEN_MAP:<id>] — open hospital detail+map panel
[SET_FILTER:<name>] — set filter (All/Cardiac/Neuro/Ortho/Oncology/Pediatrics)
[BOOK_BED:<id>] — trigger bed booking flow for hospital
[COMPARE:<id1>,<id2>] — show comparison of two hospitals
[NEXT_HOSPITAL] — show next best option (user says "dusra dikhao"/"show another")
[EMERGENCY] — trigger emergency mode

FLOW:
1. User describes symptoms → gauge severity (0-10)
2. 0-3: suggest clinic/pharmacy, no hospital needed
3. 4-6: recommend best matching hospital by specialty+rating+wait → [OPEN_MAP:id]
4. 7-10: CRITICAL → shortest ER reply, best ER hospital → [OPEN_MAP:id]. If life-threatening → also [EMERGENCY]
5. After recommending, if user says "book"/"confirm"/"reserve" → [BOOK_BED:id]
6. "show another"/"next"/"dusra" → [NEXT_HOSPITAL]
7. "compare"/"konsa better" → [COMPARE:id1,id2]
8. NEVER invent hospitals. Only use listed ones.
9. Max 2-3 lines. No fluff. Action-oriented.
10. chest pain/stroke/unconscious/can't breathe → skip ALL questions, instant [OPEN_MAP] + [EMERGENCY]

SPECIALTY MAP: chest/heart→Cardiac, head/brain/seizure→Neuro, bone/fracture/joint→Ortho, cancer/tumor→Oncology, child/baby→Pediatrics

REMEMBER: You help people in health emergencies. Be fast. Be useful. Save lives.`;

    /* ── Trim conversation to last 4 messages, cap each at 300 chars ── */
    const trimmedMessages = messages
      .filter(m => (m.role === "user" || m.role === "assistant") && m.content?.trim())
      .slice(-4)
      .map(m => ({ role: m.role, content: String(m.content).slice(0, 300) }));

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...trimmedMessages,
      ],
      temperature: 0.6,
      max_tokens: 200,
      stream: false,
    });

    const reply =
      completion.choices[0]?.message?.content ||
      "Sorry, couldn't process that. Please try again.";

    return Response.json({ reply, model: "groq" });

  } catch (error) {
    console.error("Groq API error:", error);
    return Response.json(
      { reply: "Service unavailable. Please try again.", model: "error" },
      { status: 500 }
    );
  }
}
