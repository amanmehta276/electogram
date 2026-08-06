import { useMemo } from "react"
import { convertCircuitJsonToSimulationGraphSvg } from "circuit-to-svg"
import { downloadTextFile } from "./downloadFile"
import "./SimulationPanel.css"

interface SimulationPanelProps {
  circuitJson: any[] | null
  onClose: () => void
}

export function SimulationPanel({ circuitJson, onClose }: SimulationPanelProps) {
  const experiment = useMemo(() => {
    if (!circuitJson) return null
    return (
      circuitJson.find((el: any) => el?.type === "simulation_experiment") ??
      null
    )
  }, [circuitJson])

  const graphSvg = useMemo(() => {
    if (!circuitJson || !experiment) return null
    try {
      return convertCircuitJsonToSimulationGraphSvg({
        circuitJson: circuitJson as any,
        simulation_experiment_id: experiment.simulation_experiment_id,
      })
    } catch {
      return null
    }
  }, [circuitJson, experiment])

  const handleDownload = () => {
    if (!graphSvg) return
    downloadTextFile("simulation-graph.svg", graphSvg, "image/svg+xml")
  }

  return (
    <div className="sim-overlay" onClick={onClose}>
      <aside
        className="sim-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Simulation results"
      >
        <div className="sim-header">
          <div>
            <div className="sim-eyebrow">SPICE simulation</div>
            <h2>Simulation graph</h2>
          </div>
          <button className="sim-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {!experiment ? (
          <p className="sim-empty">
            No simulation found in the current build. Add a simulation
            element to your circuit, for example:
            <pre className="sim-example">
              <code>{`<analogtransientsimulation duration="20ms" />`}</code>
            </pre>
            along with at least one <code>&lt;voltageprobe /&gt;</code>, then
            hit Run again.
          </p>
        ) : !graphSvg ? (
          <p className="sim-empty">
            Found a simulation ("{experiment.name}") but couldn't render its
            graph — this simulation type may not be supported for graph
            rendering yet.
          </p>
        ) : (
          <>
            <p className="sim-note">
              Real ngspice-backed simulation results for "{experiment.name}".
            </p>
            <div
              className="sim-graph"
              dangerouslySetInnerHTML={{ __html: graphSvg }}
            />
            <button className="sim-download" onClick={handleDownload}>
              Download graph (.svg)
            </button>
          </>
        )}
      </aside>
    </div>
  )
}
