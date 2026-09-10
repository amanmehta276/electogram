import { X } from "lucide-react"
import "./BOMPanel.css"

interface BOMPanelProps { code: string; onClose: () => void }

const PRICES: Record<string, { label: string; price: number }> = {
  resistor: { label: "Resistor", price: 0.5 },
  capacitor: { label: "Capacitor", price: 2 },
  inductor: { label: "Inductor", price: 8 },
  led: { label: "LED", price: 2 },
  diode: { label: "Diode", price: 1 },
  transistor: { label: "Transistor", price: 2 },
  mosfet: { label: "MOSFET", price: 12 },
  battery: { label: "Battery", price: 20 },
  crystal: { label: "Crystal oscillator", price: 10 },
  resonator: { label: "Resonator", price: 8 },
  potentiometer: { label: "Potentiometer", price: 18 },
  pushbutton: { label: "Push button", price: 2 },
  fuse: { label: "Fuse", price: 4 },
  jumper: { label: "Jumper", price: 1.5 },
  opamp: { label: "Op-amp IC", price: 10 },
  testpoint: { label: "Test point", price: 1 },
  pinheader: { label: "Pin header", price: 1.5 },
  voltageSource: { label: "Voltage source", price: 0 },
  chip: { label: "Generic digital IC", price: 30 },
  logicgate: { label: "Logic gate IC", price: 15 },
  microcontroller: { label: "Microcontroller", price: 180 },
  timer555: { label: "555 timer", price: 12 },
  shiftregister: { label: "Shift register", price: 15 },
  usbconnector: { label: "USB-C connector", price: 10 },
}

export function BOMPanel({ code, onClose }: BOMPanelProps) {
  const counts = Object.keys(PRICES).reduce<Record<string, number>>((result, type) => {
    const regex = new RegExp(`<${type}\\b`, "g")
    result[type] = (code.match(regex) ?? []).length
    return result
  }, {})

  const rows = Object.entries(counts).filter(([, quantity]) => quantity > 0)
  const total = rows.reduce((sum, [type, quantity]) => {
    const item = PRICES[type]
    return sum + (item?.price ?? 0) * quantity
  }, 0)

  return <div className="bom-overlay" onClick={onClose}><aside className="bom-panel" onClick={(event) => event.stopPropagation()} role="dialog" aria-label="Bill of materials">
    <div className="bom-header"><div><div className="bom-eyebrow">Build estimate</div><h2>Parts & cost</h2></div><button className="bom-close" onClick={onClose} aria-label="Close"><X size={18} /></button></div>
    <p className="bom-note">Approximate India retail estimate from the components in your current circuit.</p>
    {rows.length === 0 ? <p className="bom-empty">Run or load a circuit with components to see its BOM.</p> : <><div className="bom-table"><div className="bom-row bom-row-head"><span>Part</span><span>Qty</span><span>Est.</span></div>{rows.map(([type, quantity]) => <div className="bom-row" key={type}><span>{PRICES[type].label}</span><span>{quantity}</span><span>₹{(PRICES[type].price * quantity).toFixed(2)}</span></div>)}</div><div className="bom-total"><span>Approx. kit total</span><strong>₹{total.toFixed(2)}</strong></div><p className="bom-footnote">Indicative pricing only; excludes PCB fabrication, shipping, and taxes.</p></>}
  </aside></div>
}