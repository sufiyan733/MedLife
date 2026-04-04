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

    /* ── Dense hospital lines: ~22 tokens each vs ~40 before ── */
    const status = (a, t) => { const p = a/t*100; return p>25?"OK":p>8?"LO":"CR"; };
    const hospitalLines = visibleHospitals.slice(0, 3).map((h, i) =>
      `H${i+1}|${h.id}|${h.name}|${h.distanceKm!=null?h.distanceKm.toFixed(1)+"km":"?"}|${h.waitTime}m|${h.rating}|${h.emergency?"ER":"noER"}|Beds:${h.bedsAvailable}/${h.bedsTotal}[${status(h.bedsAvailable,h.bedsTotal)}]|ICU:${h.icuAvailable}/${h.icuTotal}[${status(h.icuAvailable,h.icuTotal)}]|${h.specialties.slice(0,3).join(",")}`
    ).join("\n");

    /* ── Compact system prompt: ~180 tokens vs ~380 before ── */
    const SYSTEM_PROMPT = `You are Medi, a hospital-finding assistant.
LANGUAGE: Detect from user message. Hindi/Hinglish in → Hinglish out. English in → English out. Roman script ONLY, never Devanagari.
TONE: Casual if user is casual, serious if symptoms are serious.
GOAL: Understand health issue → recommend best nearby hospital → embed [OPEN_MAP:id].

CONTEXT:
Location: ${address ?? "unknown"}${lat&&lng?` (${lat},${lng})`:""}|granted:${locationGranted?"Y":"N"}
Filter:${activeFilter??"All"}|Shown:${totalHospitalsShown??0}|Selected:${selectedHospital?.name??"none"}

HOSPITALS (pipe-separated: name|dist|wait|rating|ER|beds|ICU|specialties):
${hospitalLines || "none"}

RULES:
- Ask ONE question at a time
- Severity: 0-3→clinic, 4-6→specialty, 7-10→ICU+ER
- Skip hospitals with no address or named exactly "Hospital"
- chest pain/stroke/unconscious/breathing → skip questions, show best hospital NOW
- "show another"/"dusra" → open next hospital directly, no re-asking symptoms
- Critical pick: ER=Y + ICU not CR + closest + lowest wait + highest rating
- Match specialty: chest→Cardiac, child→Pediatrics, head→Neuro, bone→Ortho, cancer→Oncology
- Recommend only from listed hospitals, never invent
- End recommendation with: [OPEN_MAP:<id>]
- Max 2-3 lines per reply. Direct, warm, no filler.
- Never mention Claude, Anthropic, Groq, or any AI model`;

    const trimmedMessages = messages
      .filter(m => (m.role==="user"||m.role==="assistant") && m.content?.trim())
      .slice(-4);

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...trimmedMessages,
      ],
      temperature: 0.7,
      max_tokens: 180,  // 2-3 lines never needs more than 180
      stream: false,
    });

    const reply =
      completion.choices[0]?.message?.content ||
      "Sorry, couldn't process that. Please try again.";

    return Response.json({ reply });

  } catch (error) {
    console.error("Groq API error:", error);
    return Response.json(
      { error: "Failed to get response from AI. Please try again." },
      { status: 500 }
    );
  }
}