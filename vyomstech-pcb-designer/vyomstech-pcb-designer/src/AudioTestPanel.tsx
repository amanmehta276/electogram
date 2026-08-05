import { useCallback, useEffect, useRef, useState } from "react"
import { extractRcFromCode } from "./rcFilter"
import { audioBufferToWavBlob } from "./wavEncoder"
import { downloadBlob } from "./downloadFile"
import "./AudioTestPanel.css"

interface AudioTestPanelProps {
  code: string
  onClose: () => void
}

function formatHz(hz: number) {
  if (hz >= 1000) return `${(hz / 1000).toFixed(2)} kHz`
  return `${hz.toFixed(1)} Hz`
}

export function AudioTestPanel({ code, onClose }: AudioTestPanelProps) {
  const { resistanceOhms, capacitanceFarads, cutoffHz } = extractRcFromCode(code)

  const [fileName, setFileName] = useState<string | null>(null)
  const [buffer, setBuffer] = useState<AudioBuffer | null>(null)
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  )
  const [playing, setPlaying] = useState<"original" | "filtered" | null>(null)

  const [micActive, setMicActive] = useState(false)
  const [micFiltered, setMicFiltered] = useState(true)
  const [micError, setMicError] = useState<string | null>(null)

  const ctxRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<AudioBufferSourceNode | null>(null)
  const micStreamRef = useRef<MediaStream | null>(null)
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const micFilterRef = useRef<BiquadFilterNode | null>(null)

  const getCtx = () => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext()
    }
    return ctxRef.current
  }

  const handleFile = useCallback(async (file: File) => {
    setStatus("loading")
    setFileName(file.name)
    try {
      const ctx = getCtx()
      const arrayBuffer = await file.arrayBuffer()
      const decoded = await ctx.decodeAudioData(arrayBuffer)
      setBuffer(decoded)
      setStatus("ready")
    } catch {
      setStatus("error")
    }
  }, [])

  const stop = useCallback(() => {
    sourceRef.current?.stop()
    sourceRef.current = null
    setPlaying(null)
  }, [])

  const play = useCallback(
    (mode: "original" | "filtered") => {
      if (!buffer || !cutoffHz) return
      const ctx = getCtx()
      stop()

      const source = ctx.createBufferSource()
      source.buffer = buffer

      if (mode === "filtered") {
        const filter = ctx.createBiquadFilter()
        filter.type = "lowpass"
        filter.frequency.value = cutoffHz
        source.connect(filter)
        filter.connect(ctx.destination)
      } else {
        source.connect(ctx.destination)
      }

      source.onended = () => setPlaying(null)
      source.start()
      sourceRef.current = source
      setPlaying(mode)
    },
    [buffer, cutoffHz, stop],
  )

  const downloadFiltered = useCallback(async () => {
    if (!buffer || !cutoffHz) return
    const offlineCtx = new OfflineAudioContext(
      buffer.numberOfChannels,
      buffer.length,
      buffer.sampleRate,
    )
    const source = offlineCtx.createBufferSource()
    source.buffer = buffer
    const filter = offlineCtx.createBiquadFilter()
    filter.type = "lowpass"
    filter.frequency.value = cutoffHz
    source.connect(filter)
    filter.connect(offlineCtx.destination)
    source.start()
    const rendered = await offlineCtx.startRendering()
    const wav = audioBufferToWavBlob(rendered)
    downloadBlob(`${(fileName ?? "audio").replace(/\.[^.]+$/, "")}-filtered.wav`, wav)
  }, [buffer, cutoffHz, fileName])

  const stopMic = useCallback(() => {
    micStreamRef.current?.getTracks().forEach((track) => track.stop())
    micSourceRef.current?.disconnect()
    micFilterRef.current?.disconnect()
    micStreamRef.current = null
    micSourceRef.current = null
    micFilterRef.current = null
    setMicActive(false)
  }, [])

  const startMic = useCallback(async () => {
    if (!cutoffHz) return
    setMicError(null)
    try {
      const ctx = getCtx()
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const micSource = ctx.createMediaStreamSource(stream)
      const filter = ctx.createBiquadFilter()
      filter.type = "lowpass"
      filter.frequency.value = cutoffHz

      micSource.connect(filter)
      if (micFiltered) {
        filter.connect(ctx.destination)
      } else {
        micSource.connect(ctx.destination)
      }

      micStreamRef.current = stream
      micSourceRef.current = micSource
      micFilterRef.current = filter
      setMicActive(true)
    } catch {
      setMicError(
        "Couldn't access the microphone — check browser permissions.",
      )
    }
  }, [cutoffHz, micFiltered])

  const toggleMicFilter = useCallback(() => {
    const ctx = ctxRef.current
    const micSource = micSourceRef.current
    const filter = micFilterRef.current
    if (!ctx || !micSource || !filter) return

    micSource.disconnect()
    filter.disconnect()
    micSource.connect(filter)

    const nextFiltered = !micFiltered
    if (nextFiltered) {
      filter.connect(ctx.destination)
    } else {
      micSource.connect(ctx.destination)
    }
    setMicFiltered(nextFiltered)
  }, [micFiltered])

  useEffect(() => {
    return () => {
      micStreamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  return (
    <div className="audio-overlay" onClick={onClose}>
      <aside
        className="audio-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Test with real audio"
      >
        <div className="audio-header">
          <div>
            <div className="audio-eyebrow">Real-world input</div>
            <h2>Audio test</h2>
          </div>
          <button className="audio-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {!cutoffHz ? (
          <p className="audio-empty">
            No resistor + capacitor pair was found in the current code, so a
            cutoff frequency can't be computed. This works with an RC
            low-pass filter — add a <code>&lt;resistor&gt;</code> and a{" "}
            <code>&lt;capacitor&gt;</code> to your circuit first.
          </p>
        ) : (
          <>
            <div className="audio-readout">
              <div className="audio-readout-row">
                <span>Resistance</span>
                <span>{resistanceOhms} Ω</span>
              </div>
              <div className="audio-readout-row">
                <span>Capacitance</span>
                <span>{(capacitanceFarads ?? 0) * 1e6} µF</span>
              </div>
              <div className="audio-readout-row audio-readout-highlight">
                <span>Cutoff frequency</span>
                <span>{formatHz(cutoffHz)}</span>
              </div>
            </div>
            <p className="audio-note">
              Frequencies above this cutoff get attenuated — this is what
              your circuit would do to a real audio signal.
            </p>

            <label className="audio-upload">
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFile(file)
                }}
              />
              {fileName ? "Change audio file" : "Upload an audio file"}
            </label>

            {status === "loading" && (
              <p className="audio-status">Decoding {fileName}…</p>
            )}
            {status === "error" && (
              <p className="audio-status audio-status-error">
                Couldn't decode that file — try a standard WAV or MP3.
              </p>
            )}

            {status === "ready" && buffer && (
              <div className="audio-controls">
                <p className="audio-filename">{fileName}</p>
                <div className="audio-buttons">
                  <button
                    className={playing === "original" ? "audio-btn-active" : ""}
                    onClick={() =>
                      playing === "original" ? stop() : play("original")
                    }
                  >
                    {playing === "original" ? "■ Stop" : "▶ Play original"}
                  </button>
                  <button
                    className={playing === "filtered" ? "audio-btn-active" : ""}
                    onClick={() =>
                      playing === "filtered" ? stop() : play("filtered")
                    }
                  >
                    {playing === "filtered" ? "■ Stop" : "▶ Play filtered"}
                  </button>
                </div>
                <button className="audio-download" onClick={downloadFiltered}>
                  Download filtered (.wav)
                </button>
              </div>
            )}

            <div className="audio-divider" />

            <div className="audio-live">
              <p className="audio-live-title">🎤 Live microphone</p>
              <p className="audio-note">
                Speak or play sound near your mic and hear the filter applied
                in real time. Use headphones — playing through speakers can
                cause feedback squeal.
              </p>

              {!micActive ? (
                <button className="audio-download" onClick={startMic}>
                  Start live input
                </button>
              ) : (
                <div className="audio-buttons">
                  <button className="audio-btn-active" onClick={toggleMicFilter}>
                    Filter: {micFiltered ? "ON" : "OFF"}
                  </button>
                  <button onClick={stopMic}>■ Stop</button>
                </div>
              )}

              {micError && (
                <p className="audio-status audio-status-error">{micError}</p>
              )}
            </div>
          </>        )}
      </aside>
    </div>
  )
}
