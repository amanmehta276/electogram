import { useCallback, useEffect, useRef, useState } from "react"
import { extractRcFromCode } from "./rcFilter"
import { audioBufferToWavBlob } from "./wavEncoder"
import { downloadBlob } from "./downloadFile"
import { WaveformCanvas } from "./WaveformCanvas"
import { Mic, Play, Square, Volume2, X } from "lucide-react"
import "./AudioTestPanel.css"

interface AudioTestPanelProps {
  code: string
  onClose: () => void
}

function formatHz(hz: number) {
  if (hz >= 1000) return `${(hz / 1000).toFixed(2)} kHz`
  return `${hz.toFixed(1)} Hz`
}

async function renderFiltered(
  buffer: AudioBuffer,
  filterType: "lowpass" | "highpass",
  cutoffHz: number,
): Promise<AudioBuffer> {
  const offlineCtx = new OfflineAudioContext(
    buffer.numberOfChannels,
    buffer.length,
    buffer.sampleRate,
  )
  const source = offlineCtx.createBufferSource()
  source.buffer = buffer
  const filter = offlineCtx.createBiquadFilter()
  filter.type = filterType
  filter.frequency.value = cutoffHz
  source.connect(filter)
  filter.connect(offlineCtx.destination)
  source.start()
  return offlineCtx.startRendering()
}

export function AudioTestPanel({ code, onClose }: AudioTestPanelProps) {
  const { resistanceOhms, capacitanceFarads, cutoffHz } = extractRcFromCode(code)

  const [fileName, setFileName] = useState<string | null>(null)
  const [buffer, setBuffer] = useState<AudioBuffer | null>(null)
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  )
  const [playing, setPlaying] = useState<"original" | "filtered" | null>(null)
  const [filterType, setFilterType] = useState<"lowpass" | "highpass">(
    "lowpass",
  )
  const [filteredBuffer, setFilteredBuffer] = useState<AudioBuffer | null>(
    null,
  )
  const [graphLoading, setGraphLoading] = useState(false)

  const [micActive, setMicActive] = useState(false)
  const [micFiltered, setMicFiltered] = useState(true)
  const [micError, setMicError] = useState<string | null>(null)

  const [isRecording, setIsRecording] = useState(false)
  const [recordError, setRecordError] = useState<string | null>(null)

  const ctxRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<AudioBufferSourceNode | null>(null)
  const micStreamRef = useRef<MediaStream | null>(null)
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const micFilterRef = useRef<BiquadFilterNode | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const recordStreamRef = useRef<MediaStream | null>(null)

  const getCtx = () => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext()
    }
    return ctxRef.current
  }

  useEffect(() => {
    if (!buffer || !cutoffHz) {
      setFilteredBuffer(null)
      return
    }
    let cancelled = false
    setGraphLoading(true)
    renderFiltered(buffer, filterType, cutoffHz)
      .then((rendered) => {
        if (!cancelled) {
          setFilteredBuffer(rendered)
          setGraphLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) setGraphLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [buffer, filterType, cutoffHz])

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

  const startRecording = useCallback(async () => {
    setRecordError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      recordStreamRef.current = stream
      recordedChunksRef.current = []

      const recorder = new MediaRecorder(stream)
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data)
      }
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop())
        setStatus("loading")
        try {
          const blob = new Blob(recordedChunksRef.current, {
            type: recorder.mimeType,
          })
          const arrayBuffer = await blob.arrayBuffer()
          const ctx = getCtx()
          const decoded = await ctx.decodeAudioData(arrayBuffer)
          setBuffer(decoded)
          setFileName("recorded-voice")
          setStatus("ready")
        } catch {
          setStatus("error")
        }
      }

      recorder.start()
      recorderRef.current = recorder
      setIsRecording(true)
    } catch {
      setRecordError(
        "Couldn't access the microphone — check browser permissions.",
      )
    }
  }, [])

  const submitRecording = useCallback(() => {
    recorderRef.current?.stop()
    recorderRef.current = null
    setIsRecording(false)
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
        filter.type = filterType
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
    [buffer, cutoffHz, filterType, stop],
  )

  const downloadFiltered = useCallback(async () => {
    const rendered =
      filteredBuffer ??
      (buffer && cutoffHz ? await renderFiltered(buffer, filterType, cutoffHz) : null)
    if (!rendered) return
    const wav = audioBufferToWavBlob(rendered)
    downloadBlob(`${(fileName ?? "audio").replace(/\.[^.]+$/, "")}-filtered.wav`, wav)
  }, [buffer, cutoffHz, fileName, filterType, filteredBuffer])

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
      filter.type = filterType
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
  }, [cutoffHz, micFiltered, filterType])

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
      recordStreamRef.current?.getTracks().forEach((track) => track.stop())
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
            <X size={18} aria-hidden="true" />
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
              Frequencies above the cutoff get attenuated in low-pass mode,
              or below it in high-pass mode — pick whichever matches how
              you've wired the resistor and capacitor.
            </p>

            <div className="audio-filter-select">
              <span>Filter type</span>
              <select
                value={filterType}
                disabled={micActive}
                onChange={(e) =>
                  setFilterType(e.target.value as "lowpass" | "highpass")
                }
              >
                <option value="lowpass">Low-pass (cuts highs)</option>
                <option value="highpass">High-pass (cuts lows)</option>
              </select>
            </div>

            <p className="audio-section-title">1. Give it an input</p>
            <div className="audio-input-row">
              <label className="audio-upload">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFile(file)
                  }}
                />
                Upload file
              </label>

              {!isRecording ? (
                <button className="audio-upload audio-upload-btn" onClick={startRecording}>
                  <Mic size={15} aria-hidden="true" /> Record voice
                </button>
              ) : (
                <button
                  className="audio-upload audio-upload-btn audio-recording"
                  onClick={submitRecording}
                >
                  <Square size={14} fill="currentColor" aria-hidden="true" /> Stop &amp; submit
                </button>
              )}
            </div>

            {recordError && (
              <p className="audio-status audio-status-error">{recordError}</p>
            )}
            {status === "loading" && (
              <p className="audio-status">Processing {fileName}…</p>
            )}
            {status === "error" && (
              <p className="audio-status audio-status-error">
                Couldn't decode that audio — try a standard WAV or MP3 file.
              </p>
            )}

            {status === "ready" && buffer && (
              <div className="audio-controls">
                <p className="audio-section-title">2. Hear the output</p>
                <p className="audio-filename">{fileName}</p>

                <div className="audio-waveform-block">
                  <div className="audio-waveform-label">
                    <span className="audio-waveform-dot audio-waveform-dot-input" />
                    Input
                  </div>
                  <WaveformCanvas buffer={buffer} color="#eef1ec" />
                </div>

                <div className="audio-waveform-block">
                  <div className="audio-waveform-label">
                    <span className="audio-waveform-dot audio-waveform-dot-output" />
                    Filtered output {graphLoading && "(rendering…)"}
                  </div>
                  <WaveformCanvas buffer={filteredBuffer} color="#f0b878" />
                </div>

                <div className="audio-buttons">
                  <button
                    className={playing === "original" ? "audio-btn-active" : ""}
                    onClick={() =>
                      playing === "original" ? stop() : play("original")
                    }
                  >
                    {playing === "original" ? <><Square size={14} fill="currentColor" aria-hidden="true" /> Stop</> : <><Play size={14} fill="currentColor" aria-hidden="true" /> Play input</>}
                  </button>
                  <button
                    className={playing === "filtered" ? "audio-btn-active" : ""}
                    onClick={() =>
                      playing === "filtered" ? stop() : play("filtered")
                    }
                  >
                    {playing === "filtered" ? <><Square size={14} fill="currentColor" aria-hidden="true" /> Stop</> : <><Volume2 size={15} aria-hidden="true" /> Play filtered output</>}
                  </button>
                </div>
                <p className="audio-section-title">3. Download the output</p>
                <button className="audio-download" onClick={downloadFiltered}>
                  Download filtered output (.wav)
                </button>
              </div>
            )}

            <div className="audio-divider" />

            <div className="audio-live">
              <p className="audio-live-title">🎤 Live monitor (continuous)</p>
              <p className="audio-note">
                For an ongoing live feed instead of a one-shot recording —
                hear the filter applied continuously as you speak. Use
                headphones to avoid feedback squeal.
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
                  <button onClick={stopMic}>
                    <Square size={14} fill="currentColor" aria-hidden="true" /> Stop
                  </button>
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
