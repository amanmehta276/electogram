import { useCallback, useState } from "react"
import "./AIAssistantPanel.css"

interface AIAssistantPanelProps {
  onClose: () => void
  onInsert: (code: string) => void
}

export function AIAssistantPanel({ onClose, onInsert }: AIAssistantPanelProps) {
  const [description, setDescription] = useState("")
  const [generatedCode, setGeneratedCode] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const generate = useCallback(async () => {
    if (!description.trim()) return

    setStatus("loading")
    setErrorMsg(null)
    setGeneratedCode(null)
    setWarnings([])

    try {
      const res = await fetch("/.netlify/functions/generate-circuit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ description: description.trim() }),
      })

      const responseBody = await res.text()
      let data: { code?: string; warnings?: unknown; error?: string } = {}
      try {
        data = JSON.parse(responseBody)
      } catch {
        data.error = responseBody.slice(0, 300)
      }

      if (!res.ok) {
        throw new Error(data.error ?? `Request failed (${res.status})`)
      }

      if (typeof data.code !== "string" || !data.code.trim()) {
        throw new Error("The server returned no circuit code. Please try again.")
      }

      setGeneratedCode(data.code)
      setWarnings(
        Array.isArray(data.warnings)
          ? data.warnings.filter(
              (warning): warning is string => typeof warning === "string",
            )
          : [],
      )
      setStatus("idle")
    } catch (err) {
      setStatus("error")
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.")
    }
  }, [description])

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
            <div className="ai-eyebrow">AI Assistant · Free</div>
            <h2>Trace, what can I build for you?</h2>
          </div>
          <button className="ai-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <p className="ai-note">
          No API key needed — this runs through VyomsTech's own server.
        </p>

        <label className="ai-field-label" htmlFor="ai-desc">
          Describe the circuit you want Trace to build.
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
          {status === "loading" ? "Generating…" : "✨ Generate circuit"}
        </button>

        {status === "error" && errorMsg && (
          <p className="ai-status ai-status-error">{errorMsg}</p>
        )}

        {generatedCode && (
          <div className="ai-result">
            {warnings.length > 0 && (
              <p className="ai-status ai-status-warn">
                ⚠ {warnings.join(" · ")} — double-check before relying on this.
              </p>
            )}
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