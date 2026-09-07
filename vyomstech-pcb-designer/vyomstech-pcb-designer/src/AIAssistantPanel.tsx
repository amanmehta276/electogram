import { useCallback, useState } from "react"
import "./AIAssistantPanel.css"

interface AIAssistantPanelProps {
  onClose: () => void
  onInsert: (code: string) => void
}

const API_KEY_STORAGE = "vyomstech-anthropic-key"
const MODEL = "claude-sonnet-5"

const SYSTEM_PROMPT = `You write circuits in "VyomLang" — a JSX-based syntax built on the tscircuit engine.

GOLDEN RULE: every design must be wrapped in circuit.add(...). Never use "export default".

CONFIRMED PIN NAMES (do not invent others):
- resistor, capacitor, inductor, voltagesource, fuse: pin1, pin2
- led, diode: anode, cathode
- pushbutton: pin1, pin2 (both sides are the same electrical contact)
- battery: pos, neg
- potentiometer: pin1, pin2, pin3
- crystal: pin1, pin2 (footprint="crystal")

FOOTPRINT RULE: any component with pcbX/pcbY needs a footprint prop. Common values:
0402, 0603, 0805, sod123 (diode), sot23 (transistor/mosfet), soic8 (opamp/chip), pushbutton (pushbutton component), crystal (crystal component).
battery and potentiometer have no dedicated footprint generator — use "0805" as a generic placeholder for them.

AVAILABLE COMPONENTS: board, resistor, capacitor, inductor, led, diode, transistor, mosfet,
battery, pinheader, crystal, resonator, potentiometer, pushbutton, fuse, jumper, opamp,
testpoint, voltagesource, voltageprobe, trace.

For a physical on/off switch use <pushbutton>, not <switch> — <switch> requires a
footprinter-specific string and commonly fails with made-up values.

Always name every <trace> (name="T1", "T2", ...).
Use net.NAME (e.g. net.VCC, net.GND) for shared connections, and ".ComponentName > .pin"
for specific pins.

Respond with ONLY a single \`\`\`tsx code block containing the full circuit.add(...) design.
No commentary before or after the code block.`

export function AIAssistantPanel({ onClose, onInsert }: AIAssistantPanelProps) {
  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem(API_KEY_STORAGE) ?? "",
  )
  const [description, setDescription] = useState("")
  const [generatedCode, setGeneratedCode] = useState<string | null>(null)
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const saveKey = useCallback((value: string) => {
    setApiKey(value)
    localStorage.setItem(API_KEY_STORAGE, value)
  }, [])

  const generate = useCallback(async () => {
    if (!apiKey.trim()) {
      setStatus("error")
      setErrorMsg("Add your Anthropic API key first.")
      return
    }
    if (!description.trim()) return

    setStatus("loading")
    setErrorMsg(null)
    setGeneratedCode(null)

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey.trim(),
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 1500,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: description.trim() }],
        }),
      })

      if (!res.ok) {
        const body = await res.text()
        throw new Error(`API error ${res.status}: ${body.slice(0, 200)}`)
      }

      const data = await res.json()
      const text = data?.content?.[0]?.text ?? ""
      const match = text.match(/```(?:tsx|jsx|typescript)?\s*([\s\S]*?)```/)
      const code = (match ? match[1] : text).trim()

      if (!code) throw new Error("No code came back — try rephrasing the description.")

      setGeneratedCode(code)
      setStatus("idle")
    } catch (err) {
      setStatus("error")
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.")
    }
  }, [apiKey, description])

  return (
    <div className="ai-overlay" onClick={onClose}>
      <aside
        className="ai-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="AI circuit assistant"
      >
        <div className="ai-header">
          <div>
            <div className="ai-eyebrow">AI Assistant</div>
            <h2>Describe a circuit</h2>
          </div>
          <button className="ai-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <label className="ai-field-label" htmlFor="ai-key">
          Anthropic API key
        </label>
        <input
          id="ai-key"
          type="password"
          className="ai-key-input"
          placeholder="sk-ant-..."
          value={apiKey}
          onChange={(e) => saveKey(e.target.value)}
        />
        <p className="ai-note">
          Stored only in this browser, sent directly to Anthropic — never through any
          server of ours. Get a key at{" "}
          <a
            href="https://console.anthropic.com/settings/keys"
            target="_blank"
            rel="noreferrer"
          >
            console.anthropic.com
          </a>
          .
        </p>

        <label className="ai-field-label" htmlFor="ai-desc">
          What do you want to build?
        </label>
        <textarea
          id="ai-desc"
          className="ai-textarea"
          placeholder="e.g. an LED that blinks when a button is pressed, with a current-limiting resistor"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
        />

        <button
          className="ai-generate-btn"
          onClick={generate}
          disabled={status === "loading"}
        >
          {status === "loading" ? "Generating..." : "Generate circuit"}
        </button>

        {status === "error" && errorMsg && (
          <p className="ai-status ai-status-error">{errorMsg}</p>
        )}

        {generatedCode && (
          <div className="ai-result">
            <p className="ai-field-label">Generated VyomLang</p>
            <pre className="ai-code">
              <code>{generatedCode}</code>
            </pre>
            <button
              className="ai-insert-btn"
              onClick={() => {
                onInsert(generatedCode)
                onClose()
              }}
            >
              Insert into editor
            </button>
          </div>
        )}
      </aside>
    </div>
  )
}
