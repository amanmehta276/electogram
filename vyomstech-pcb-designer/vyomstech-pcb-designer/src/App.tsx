import { useCallback, useState } from "react"
import Editor, { type OnMount } from "@monaco-editor/react"
import { RunFrame } from "@tscircuit/runframe/runner"
import {
  convertCircuitJsonToPcbSvg,
  convertCircuitJsonToSchematicSvg,
} from "circuit-to-svg"
import { Cheatsheet } from "./Cheatsheet"
import { ProjectsPanel } from "./ProjectsPanel"
import { useProjects, type Project } from "./useProjects"
import { downloadTextFile } from "./downloadFile"
import "./App.css"

const DEFAULT_CODE = `circuit.add(
  <board width="30mm" height="20mm">
    <resistor name="R1" resistance="1k" footprint="0402" pcbX={-6} pcbY={0} />
    <led name="LED1" color="red" footprint="0603" pcbX={6} pcbY={0} />
    <trace from="net.VCC" to=".R1 > .pin1" />
    <trace from=".R1 > .pin2" to=".LED1 > .anode" />
    <trace from=".LED1 > .cathode" to="net.GND" />
  </board>
)
`

const ENTRYPOINT = "index.tsx"

type Status = "idle" | "running" | "ok" | "error"

function App() {
  const [code, setCode] = useState(DEFAULT_CODE)
  const [fsMap, setFsMap] = useState<Record<string, string>>({
    [ENTRYPOINT]: DEFAULT_CODE,
  })
  const [status, setStatus] = useState<Status>("idle")
  const [showCheatsheet, setShowCheatsheet] = useState(false)

  const { projects, saveProject, deleteProject } = useProjects()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [projectName, setProjectName] = useState("Untitled board")
  const [showProjects, setShowProjects] = useState(false)
  const [saveFlash, setSaveFlash] = useState(false)

  const [circuitJson, setCircuitJson] = useState<any[] | null>(null)
  const [showDownloadMenu, setShowDownloadMenu] = useState(false)

  const runCode = useCallback((nextCode: string) => {
    setStatus("running")
    setFsMap({ [ENTRYPOINT]: nextCode })
  }, [])

  const handleSave = useCallback(() => {
    const saved = saveProject(activeId, projectName.trim() || "Untitled board", code)
    setActiveId(saved.id)
    setSaveFlash(true)
    setTimeout(() => setSaveFlash(false), 1200)
  }, [activeId, projectName, code, saveProject])

  const handleLoad = useCallback(
    (project: Project) => {
      setActiveId(project.id)
      setProjectName(project.name)
      setCode(project.code)
      runCode(project.code)
      setShowProjects(false)
    },
    [runCode],
  )

  const handleNew = useCallback(() => {
    setActiveId(null)
    setProjectName("Untitled board")
    setCode(DEFAULT_CODE)
    runCode(DEFAULT_CODE)
  }, [runCode])

  const handleEditorChange = useCallback((value: string | undefined) => {
    setCode(value ?? "")
  }, [])

  const slug = (projectName.trim() || "untitled-board")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")

  const handleDownloadCode = useCallback(() => {
    downloadTextFile(`${slug}.tsx`, code, "text/plain;charset=utf-8")
    setShowDownloadMenu(false)
  }, [code, slug])

  const handleDownloadPcbSvg = useCallback(() => {
    if (!circuitJson) return
    const svg = convertCircuitJsonToPcbSvg(circuitJson as any)
    downloadTextFile(`${slug}-pcb.svg`, svg, "image/svg+xml")
    setShowDownloadMenu(false)
  }, [circuitJson, slug])

  const handleDownloadSchematicSvg = useCallback(() => {
    if (!circuitJson) return
    const svg = convertCircuitJsonToSchematicSvg(circuitJson as any)
    downloadTextFile(`${slug}-schematic.svg`, svg, "image/svg+xml")
    setShowDownloadMenu(false)
  }, [circuitJson, slug])

  const handleDownloadCircuitJson = useCallback(() => {
    if (!circuitJson) return
    downloadTextFile(
      `${slug}-circuit.json`,
      JSON.stringify(circuitJson, null, 2),
      "application/json",
    )
    setShowDownloadMenu(false)
  }, [circuitJson, slug])

  const handleEditorMount: OnMount = (editor, monaco) => {
    editor.updateOptions({
      fontFamily: "'Space Mono', monospace",
      fontSize: 13,
      minimap: { enabled: false },
      padding: { top: 16 },
      renderLineHighlight: "none",
      scrollBeyondLastLine: false,
    })

    // VyomLang's tags (<board>, <resistor>, ...) and the ambient `circuit`
    // global aren't known to Monaco's TS worker, so it would otherwise flag
    // them as errors even though the actual VyomLang compiler accepts them.
    // Syntax validation (real typos, unbalanced brackets) stays on.
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: false,
    })
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <circle cx="4" cy="4" r="2" fill="currentColor" />
              <circle cx="20" cy="4" r="2" fill="currentColor" />
              <circle cx="4" cy="20" r="2" fill="currentColor" />
              <circle cx="20" cy="20" r="2" fill="currentColor" />
              <path
                d="M4 6v6h8v6M20 6v4h-6v4"
                stroke="currentColor"
                strokeWidth="1.4"
                fill="none"
              />
            </svg>
          </span>
          <span className="brand-name">VyomsTech</span>
          <span className="brand-divider">/</span>
          <span className="brand-product">PCB Designer</span>
        </div>

        <div className="project-bar">
          <input
            className="project-name-input"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            aria-label="Board name"
          />
          <button className="topbar-btn" onClick={handleNew}>
            New
          </button>
          <button className="topbar-btn topbar-btn-primary" onClick={handleSave}>
            {saveFlash ? "Saved" : "Save"}
          </button>
          <button className="topbar-btn" onClick={() => setShowProjects(true)}>
            Boards ({projects.length})
          </button>
        </div>

        <div className="topbar-right">
          <button
            className="syntax-btn"
            onClick={() => setShowCheatsheet(true)}
          >
            VyomLang syntax
          </button>

          <div className="download-wrap">
            <button
              className="topbar-btn"
              onClick={() => setShowDownloadMenu((v) => !v)}
            >
              Download ▾
            </button>
            {showDownloadMenu && (
              <>
                <div
                  className="download-menu-overlay"
                  onClick={() => setShowDownloadMenu(false)}
                />
                <div className="download-menu">
                  <button onClick={handleDownloadCode}>Code (.tsx)</button>
                  <button onClick={handleDownloadPcbSvg} disabled={!circuitJson}>
                    PCB (.svg)
                  </button>
                  <button
                    onClick={handleDownloadSchematicSvg}
                    disabled={!circuitJson}
                  >
                    Schematic (.svg)
                  </button>
                  <button
                    onClick={handleDownloadCircuitJson}
                    disabled={!circuitJson}
                  >
                    Circuit JSON
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="status" role="status">
            <span className={`led led-${status}`} aria-hidden="true" />
            <span className="status-label">
              {status === "idle" && "Ready"}
              {status === "running" && "Building"}
              {status === "ok" && "Board OK"}
              {status === "error" && "Build error"}
            </span>
          </div>
        </div>
      </header>

      {showCheatsheet && (
        <Cheatsheet onClose={() => setShowCheatsheet(false)} />
      )}

      {showProjects && (
        <ProjectsPanel
          projects={projects}
          activeId={activeId}
          onClose={() => setShowProjects(false)}
          onLoad={handleLoad}
          onDelete={deleteProject}
        />
      )}

      <main className="workspace">
        <section className="panel editor-panel">
          <div className="panel-label">
            <span>circuit.vyom</span>
            <span className="panel-label-sub">VyomLang</span>
            <button
              className="run-btn"
              onClick={() => runCode(code)}
            >
              ▶ Run
            </button>
          </div>
          <div className="editor-shell">
            <Editor
              defaultLanguage="typescript"
              defaultPath="file:///index.tsx"
              value={code}
              theme="vs-dark"
              onMount={handleEditorMount}
              onChange={handleEditorChange}
              options={{
                automaticLayout: true,
              }}
            />
          </div>
        </section>

        <section className="panel preview-panel">
          <RunFrame
            fsMap={fsMap}
            entrypoint={ENTRYPOINT}
            showRunButton={false}
            showToggleFullScreen={false}
            onRenderStarted={() => setStatus("running")}
            onRenderFinished={() => setStatus("ok")}
            onError={() => setStatus("error")}
            onCircuitJsonChange={(json) => setCircuitJson(json)}
          />
        </section>
      </main>
    </div>
  )
}

export default App
