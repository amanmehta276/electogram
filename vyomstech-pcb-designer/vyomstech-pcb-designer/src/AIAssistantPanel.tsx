import { useCallback, useEffect, useState } from "react"
import { AlertTriangle, Languages, Mic, MicOff, Sparkles, X } from "lucide-react"
import "./AIAssistantPanel.css"

type SpeechRecognitionInstance = {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: (event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void
  onerror: () => void
  onend: () => void
  start: () => void
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance

interface AIAssistantPanelProps {
  onClose: () => void
  onInsert: (code: string) => void
}

export function AIAssistantPanel({ onClose, onInsert }: AIAssistantPanelProps) {
  const [description, setDescription] = useState("")
  const [language, setLanguage] = useState<"en" | "hi">("en")
  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const [generatedCode, setGeneratedCode] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    const speechWindow = window as typeof window & {
      SpeechRecognition?: SpeechRecognitionConstructor
      webkitSpeechRecognition?: SpeechRecognitionConstructor
    }
    setSpeechSupported(Boolean(speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition))
  }, [])

  const toggleListening = useCallback(() => {
    const speechWindow = window as typeof window & {
      SpeechRecognition?: SpeechRecognitionConstructor
      webkitSpeechRecognition?: SpeechRecognitionConstructor
    }
    const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition
    if (!Recognition) return

    if (isListening) {
      setIsListening(false)
      return
    }

    const recognition = new Recognition()
    recognition.lang = language === "hi" ? "hi-IN" : "en-IN"
    recognition.interimResults = false
    recognition.continuous = false
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? ""
      setDescription((current) => current ? `${current} ${transcript}` : transcript)
    }
    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)
    setIsListening(true)
    recognition.start()
  }, [isListening, language])

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
        body: JSON.stringify({
          description: language === "hi"
            ? `User description may be in Hindi. Understand it and generate the requested circuit.\n\n${description.trim()}`
            : description.trim(),
        }),
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
  }, [description, language])

  const hindi = language === "hi"

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
            <div className="ai-eyebrow">{hindi ? "Namaste, main Trace hoon!" : "Hey I am Trace!"}</div>
            <h2>{hindi ? "Trace aapke liye kya banaaye?" : "What can Trace build for you?"}</h2>
          </div>
          <button className="ai-close" onClick={onClose} aria-label="Close">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="ai-toolbar">
          <button
            className={`ai-language-btn ${hindi ? "is-active" : ""}`}
            onClick={() => setLanguage(hindi ? "en" : "hi")}
            type="button"
          >
            <Languages size={14} aria-hidden="true" /> {hindi ? "English" : "हिंदी में पूछें"}
          </button>
          <button
            className={`ai-mic-btn ${isListening ? "is-listening" : ""}`}
            onClick={toggleListening}
            disabled={!speechSupported}
            type="button"
            title={speechSupported ? (isListening ? "Stop listening" : "Speak your circuit") : "Voice input is not supported in this browser"}
          >
            {isListening ? <MicOff size={15} aria-hidden="true" /> : <Mic size={15} aria-hidden="true" />}
            {isListening ? "Listening…" : "Speak"}
          </button>
        </div>

        <p className="ai-note">
          {hindi
            ? "Circuit ko Hindi ya English me describe karein. Trace aapke liye VyomLang code banayega; use karne se pehle code check kar lein."
            : "Describe a circuit in English or Hindi. Trace will generate VyomLang code for you; double-check it before using it."}
        </p>

        <label className="ai-field-label" htmlFor="ai-desc">
          {hindi ? "Trace ko batayein kya banana hai" : "Describe the circuit you want Trace to build."}
        </label>
        <textarea
          id="ai-desc"
          className="ai-textarea"
          placeholder={hindi
            ? "Jaise: button dabane par jalne wali LED banao, resistor ke saath"
            : "e.g. an LED that blinks when a button is pressed, with a current-limiting resistor"}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
        />

        <button
          className="ai-generate-btn"
          onClick={generate}
          disabled={status === "loading"}
        >
          {status === "loading" ? (hindi ? "Ban raha hai…" : "Generating…") : <><Sparkles size={15} aria-hidden="true" /> {hindi ? "Circuit banao" : "Generate circuit"}</>}
        </button>

        {status === "error" && errorMsg && (
          <p className="ai-status ai-status-error">{errorMsg}</p>
        )}

        {generatedCode && (
          <div className="ai-result">
            {warnings.length > 0 && (
              <p className="ai-status ai-status-warn">
                <AlertTriangle size={15} aria-hidden="true" /> {warnings.join(" · ")} — double-check before relying on this.
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