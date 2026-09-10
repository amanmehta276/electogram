import { X } from "lucide-react"
import "./TemplatesPanel.css"

export interface CircuitTemplate {
  id: string
  name: string
  hindiName: string
  description: string
  code: string
  level: string
}

export const CIRCUIT_TEMPLATES: CircuitTemplate[] = [
  { id: "led", name: "LED indicator", hindiName: "LED indicator", description: "A safe beginner-friendly LED circuit", level: "Starter", code: `circuit.add(\n  <board width="30mm" height="20mm">\n    <resistor name="R1" resistance="1k" footprint="0402" pcbX={-6} pcbY={0} />\n    <led name="LED1" color="red" footprint="0603" pcbX={6} pcbY={0} />\n    <trace from="net.VCC" to=".R1 > .pin1" />\n    <trace from=".R1 > .pin2" to=".LED1 > .anode" />\n    <trace from=".LED1 > .cathode" to="net.GND" />\n  </board>\n)` },
  { id: "button", name: "Button + LED", hindiName: "Button se LED", description: "Learn input, output, and a current-limiting resistor", level: "Starter", code: `circuit.add(\n  <board width="35mm" height="22mm">\n    <button name="SW1" footprint="6mm" pcbX={-7} pcbY={0} />\n    <resistor name="R1" resistance="1k" footprint="0402" pcbX={0} pcbY={0} />\n    <led name="LED1" color="green" footprint="0603" pcbX={8} pcbY={0} />\n    <trace from="net.VCC" to=".SW1 > .pin1" />\n    <trace from=".SW1 > .pin2" to=".R1 > .pin1" />\n    <trace from=".R1 > .pin2" to=".LED1 > .anode" />\n    <trace from=".LED1 > .cathode" to="net.GND" />\n  </board>\n)` },
  { id: "filter", name: "RC filter", hindiName: "RC filter", description: "See how resistor and capacitor shape a signal", level: "Intermediate", code: `circuit.add(\n  <board width="35mm" height="22mm">\n    <resistor name="R1" resistance="10k" footprint="0402" pcbX={-6} pcbY={0} />\n    <capacitor name="C1" capacitance="100nF" footprint="0402" pcbX={6} pcbY={0} />\n    <trace from="net.VCC" to=".R1 > .pin1" />\n    <trace from=".R1 > .pin2" to=".C1 > .pin1" />\n    <trace from=".C1 > .pin2" to="net.GND" />\n  </board>\n)` },
]

interface TemplatesPanelProps { onClose: () => void; onSelect: (template: CircuitTemplate) => void }

export function TemplatesPanel({ onClose, onSelect }: TemplatesPanelProps) {
  return <div className="templates-overlay" onClick={onClose}>
    <aside className="templates-panel" onClick={(event) => event.stopPropagation()} role="dialog" aria-label="Circuit templates">
      <div className="templates-header"><div><div className="templates-eyebrow">Start learning</div><h2>Template gallery</h2></div><button className="templates-close" onClick={onClose} aria-label="Close templates"><X size={18} /></button></div>
      <p className="templates-note">Pick a working circuit, then change one thing and run it. Hindi names make discovery easier in classrooms.</p>
      <div className="template-list">{CIRCUIT_TEMPLATES.map((template) => <button className="template-card" key={template.id} onClick={() => onSelect(template)}><span className="template-card-top"><strong>{template.name}</strong><span>{template.level}</span></span><span className="template-hindi">{template.hindiName}</span><span className="template-description">{template.description}</span><span className="template-action">Load circuit</span></button>)}</div>
    </aside>
  </div>
}