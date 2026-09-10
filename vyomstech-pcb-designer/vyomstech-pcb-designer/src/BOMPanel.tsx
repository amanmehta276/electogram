import { X } from "lucide-react"
import "./BOMPanel.css"

interface BOMPanelProps { code: string; onClose: () => void }
const PRICES: Record<string, { label: string; price: number }> = { resistor: { label: "Resistor", price: 2 }, led: { label: "LED", price: 4 }, capacitor: { label: "Capacitor", price: 3 }, button: { label: "Push button", price: 5 }, chip: { label: "IC / chip", price: 35 } }

export function BOMPanel({ code, onClose }: BOMPanelProps) {
  const counts = Object.keys(PRICES).reduce<Record<string, number>>((result, type) => { result[type] = (code.match(new RegExp(`<${type}\\b`, "g")) ?? []).length; return result }, {})
  const rows = Object.entries(counts).filter(([, quantity]) => quantity > 0)
  const total = rows.reduce((sum, [type, quantity]) => sum + PRICES[type].price * quantity, 0)
  return <div className="bom-overlay" onClick={onClose}><aside className="bom-panel" onClick={(event) => event.stopPropagation()} role="dialog" aria-label="Bill of materials">
    <div className="bom-header"><div><div className="bom-eyebrow">Build estimate</div><h2>Parts & cost</h2></div><button className="bom-close" onClick={onClose} aria-label="Close"><X size={18} /></button></div>
    <p className="bom-note">Approximate student-kit estimate from the components in your current circuit.</p>
    {rows.length === 0 ? <p className="bom-empty">Run or load a circuit with components to see its BOM.</p> : <><div className="bom-table"><div className="bom-row bom-row-head"><span>Part</span><span>Qty</span><span>Est.</span></div>{rows.map(([type, quantity]) => <div className="bom-row" key={type}><span>{PRICES[type].label}</span><span>{quantity}</span><span>₹{PRICES[type].price * quantity}</span></div>)}</div><div className="bom-total"><span>Approx. kit total</span><strong>₹{total}</strong></div><p className="bom-footnote">Prices exclude PCB fabrication, shipping, and taxes.</p></>}
  </aside></div>
}