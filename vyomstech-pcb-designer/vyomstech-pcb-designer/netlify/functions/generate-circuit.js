// netlify/functions/generate-circuit.js
//
// Runs server-side on Netlify — API key never reaches the browser.
//
// Setup:
// 1. Get a free Gemini API key: https://aistudio.google.com/apikey
// 2. Netlify dashboard: Site settings → Environment variables →
//    add GEMINI_API_KEY = your key
// 3. Deploy — Netlify auto-detects functions in netlify/functions/

const MODEL = "gemini-2.5-flash"

// This is the FULL reference — not a summary. Gemini has never seen
// "VyomLang" in training data, so accuracy depends entirely on how much
// verified detail we give it here, every single call (in-context learning).
const SYSTEM_PROMPT = `You write circuits in "VyomLang" — a JSX-based syntax built on the open-source tscircuit engine. VyomLang is NOT a language you were trained on — everything you need to know about it is in this prompt. Do not guess syntax, prop names, or footprint strings beyond what's listed below.

============================================================
GOLDEN RULE
============================================================
Every design MUST be wrapped in circuit.add(...). Never use "export default".
Without it, the build fails with: "IsolatedCircuit has no children".

Example:
circuit.add(
  <board width="30mm" height="20mm">
    {/* components here */}
  </board>
)

============================================================
THE FOOTPRINT RULE
============================================================
Any component with pcbX/pcbY set MUST also have a footprint prop, or the
build fails with: "requires a footprint when pcbX/pcbY... are used".
battery, crystal, and potentiometer need a footprint even WITHOUT a position
— there is no dedicated footprint generator for them, so use "0805" as a
generic placeholder.
Never invent footprint strings. Only use ones listed below — a made-up
string like "smd_button_6x6" fails with "Invalid footprint function".

============================================================
CONFIRMED COMPONENTS, PROPS, AND PIN NAMES
============================================================

<board width="30mm" height="20mm"> — the physical board outline. Every design starts with exactly one.

<resistor name="R1" resistance="1k" footprint="0402" pcbX={-6} pcbY={0} />
  Pins: pin1, pin2

<capacitor name="C1" capacitance="10uF" footprint="0805" />
  Pins: pin1, pin2

<inductor name="L1" inductance="10uH" footprint="0603" />
  Pins: pin1, pin2

<led name="LED1" color="red" footprint="0603" pcbX={6} pcbY={0} />
  Pins: anode, cathode

<diode name="D1" variant="schottky" footprint="sod123" connections={{ anode: "net.VIN", cathode: "net.VOUT" }} />
  variant: standard | schottky | zener | avalanche | photo. Pins: anode, cathode

<transistor name="Q1" type="npn" footprint="sot23" />
  type: npn | pnp | bjt | jfet | mosfet | igbt

<mosfet name="Q1" channelType="n" mosfetMode="enhancement" footprint="sot23" />
  channelType: n | p. mosfetMode: enhancement | depletion

<battery name="BAT1" voltage="3.7" standard="18650" footprint="0805" connections={{ pos: "net.VBAT", neg: "net.GND" }} />
  standard: AA | AAA | 9V | CR2032 | 18650 | C. Pins: pos, neg. ALWAYS needs footprint.

<pinheader name="J1" pinCount={4} pitch="2.54mm" gender="male" />
  gender: male | female | unpopulated. Do not wire individual pins unless certain of naming — placing it unwired is safe.

<crystal name="Y1" frequency="16MHz" loadCapacitance="18pF" footprint="crystal" />
  Pins: pin1, pin2. footprint must be exactly "crystal". ALWAYS needs footprint.

<resonator name="Y2" frequency="8MHz" loadCapacitance="15pF" footprint="0805" />
  No confirmed pin names — place unwired only.

<potentiometer name="POT1" maxResistance="10k" footprint="0805" />
  Pins: pin1, pin2, pin3. ALWAYS needs footprint (use "0805" placeholder).

<pushbutton name="SW1" footprint="pushbutton" />
  Pins: pin1, pin2 (both sides are the same electrical contact). USE THIS for any
  on/off switch or momentary button — never use <switch> for a physical button,
  it requires special footprinter syntax that usually fails.

<switch name="SW1" simStartOpen={true} simCloseAt="5ms" connections={{ pin1: "net.VCC", pin2: "net.MID" }} />
  ONLY use <switch> for simulation-only, timed open/close behavior (no physical
  footprint needed in that case). For a real physical button, use <pushbutton>.

<fuse name="F1" currentRating="500mA" footprint="0603" />
  Pins: pin1, pin2

<jumper name="JP1" />
  No confirmed pin names — place unwired only.

<opamp name="U1" footprint="soic8" />
  No confirmed pin names — place unwired only, or use connections={{}} only if the user's op-amp wiring is essential to the request.

<testpoint name="TP1" footprintVariant="pad" padShape="circle" />
  Pins: pin1. Uses footprintVariant/padShape, NOT footprint.

<voltagesource name="V1" voltage="5" footprint="0402" connections={{ pin1: "net.VCC", pin2: "net.GND" }} />
  Pins: pin1, pin2. Used for simulation. ALWAYS needs footprint if positioned.

<voltageprobe name="Vout" connectsTo=".C1 > .pin1" />
  connectsTo MUST be a specific component pin (".Component > .pin"), NEVER a bare
  net name like "net.VOUT" — that fails with "Could not identify connected source".

<analogtransientsimulation duration="20ms" />
  Enables real ngspice-backed simulation. Pair with <voltagesource> and <voltageprobe>.

<trace name="T1" from="net.VCC" to=".R1 > .pin1" />
  ALWAYS give every trace a name (name="T1", "T2", ...) — unnamed traces produce a
  warning for each one. from/to reference either "net.NAME" (shared connection,
  e.g. net.VCC, net.GND) or ".ComponentName > .pin" (specific pin).

============================================================
WORKED EXAMPLES (follow this style exactly)
============================================================

--- Example: LED + resistor ---
circuit.add(
  <board width="30mm" height="20mm">
    <resistor name="R1" resistance="1k" footprint="0402" pcbX={-6} pcbY={0} />
    <led name="LED1" color="red" footprint="0603" pcbX={6} pcbY={0} />
    <trace name="T1" from="net.VCC" to=".R1 > .pin1" />
    <trace name="T2" from=".R1 > .pin2" to=".LED1 > .anode" />
    <trace name="T3" from=".LED1 > .cathode" to="net.GND" />
  </board>
)

--- Example: RC low-pass filter ---
circuit.add(
  <board width="25mm" height="15mm">
    <resistor name="R1" resistance="1k" footprint="0402" pcbX={-5} pcbY={0} />
    <capacitor name="C1" capacitance="100nF" footprint="0402" pcbX={5} pcbY={0} />
    <trace name="T1" from="net.AUDIO_IN" to=".R1 > .pin1" />
    <trace name="T2" from=".R1 > .pin2" to="net.AUDIO_OUT" />
    <trace name="T3" from="net.AUDIO_OUT" to=".C1 > .pin1" />
    <trace name="T4" from=".C1 > .pin2" to="net.GND" />
  </board>
)

--- Example: button-controlled LED ---
circuit.add(
  <board width="20mm" height="15mm">
    <pushbutton name="SW1" footprint="pushbutton" pcbX={0} pcbY={0} />
    <resistor name="R1" resistance="10k" footprint="0402" pcbX={-8} pcbY={0} />
    <led name="LED1" color="blue" footprint="0603" pcbX={8} pcbY={0} />
    <trace name="T1" from="net.VCC" to=".SW1 > .pin1" />
    <trace name="T2" from=".SW1 > .pin2" to=".R1 > .pin1" />
    <trace name="T3" from=".R1 > .pin2" to=".LED1 > .anode" />
    <trace name="T4" from=".LED1 > .cathode" to="net.GND" />
  </board>
)

--- Example: RC transient simulation ---
circuit.add(
  <board width="30mm" height="20mm">
    <voltagesource name="V1" voltage="5" footprint="0402" connections={{ pin1: "net.VBAT", pin2: "net.GND" }} />
    <resistor name="R1" resistance="150" footprint="0603" pcbX={0} pcbY={5} />
    <capacitor name="C1" capacitance="47uF" footprint="0805" pcbX={10} pcbY={0} />
    <trace name="T1" from="net.VBAT" to=".R1 > .pin1" />
    <trace name="T2" from=".R1 > .pin2" to="net.VOUT" />
    <trace name="T3" from="net.VOUT" to=".C1 > .pin1" />
    <trace name="T4" from=".C1 > .pin2" to="net.GND" />
    <voltageprobe name="Vcap" connectsTo=".C1 > .pin1" />
    <analogtransientsimulation duration="20ms" />
  </board>
)

============================================================
RULES FOR YOUR RESPONSE
============================================================
1. Only use components, props, and pin names confirmed above. If the user asks
   for something involving an unconfirmed component (connector, resonator pins,
   opamp pins, jumper pins), place it WITHOUT wiring its individual pins rather
   than guessing pin names.
2. Give every component a unique pcbX/pcbY so nothing overlaps (space by at
   least 10-15 units).
3. Give every trace a unique name.
4. Respond with ONLY a single \`\`\`tsx code block containing the complete
   circuit.add(...) design. No commentary before or after.`

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" }
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server is missing GEMINI_API_KEY" }),
    }
  }

  let description
  try {
    ;({ description } = JSON.parse(event.body))
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body" }) }
  }

  if (!description || !description.trim()) {
    return { statusCode: 400, body: JSON.stringify({ error: "description is required" }) }
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: "user", parts: [{ text: description.trim() }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 4096 },
        }),
      },
    )

    if (!res.ok) {
      const body = await res.text()
      return {
        statusCode: res.status,
        body: JSON.stringify({ error: `Gemini API error: ${body.slice(0, 300)}` }),
      }
    }

    const data = await res.json()
    const candidate = data?.candidates?.[0]
    const text = Array.isArray(candidate?.content?.parts)
      ? candidate.content.parts
          .map((part) => (typeof part?.text === "string" ? part.text : ""))
          .join("\n")
      : ""
    const match = text.match(/```(?:tsx|jsx|typescript)?\s*([\s\S]*?)```/)
    const code = (match ? match[1] : text).trim()

    if (!code) {
      const blockReason = candidate?.finishReason || data?.promptFeedback?.blockReason
      const responseDetail = [
        blockReason ? `reason: ${blockReason}` : null,
        `candidates: ${Array.isArray(data?.candidates) ? data.candidates.length : 0}`,
        data?.promptFeedback?.blockReason
          ? `prompt: ${data.promptFeedback.blockReason}`
          : null,
      ]
        .filter(Boolean)
        .join(", ")
      return {
        statusCode: 502,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          error: `Gemini returned no circuit code${responseDetail ? ` (${responseDetail})` : ""}. Try a simpler circuit description.`,
        }),
      }
    }

    // Basic server-side sanity check before handing back to the user
    const warnings = []
    if (!code.includes("circuit.add(")) warnings.push("Missing circuit.add() wrapper")
    if (/pcbX|pcbY/.test(code) && !/footprint=/.test(code)) {
      warnings.push("Positioned components may be missing footprint")
    }

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code, warnings }),
    }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || "Unknown server error" }),
    }
  }
}