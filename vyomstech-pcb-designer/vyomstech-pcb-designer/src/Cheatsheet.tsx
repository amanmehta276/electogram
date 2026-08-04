import "./Cheatsheet.css"

interface CheatsheetProps {
  onClose: () => void
}

const ENTRIES = [
  {
    tag: "circuit.add(...)",
    desc: "The required top-level wrapper for every design. It tells the compiler where the circuit definition begins. Omitting it will cause the build to fail.",
    example: `circuit.add(
  <board width="30mm" height="20mm">
    ...
  </board>
)`,
  },
  {
    tag: "<board>",
    desc: "Defines the physical board outline via its width and height. Every design begins with exactly one board element.",
    example: `<board width="30mm" height="20mm">
  ...
</board>`,
  },
  {
    tag: "<resistor>",
    desc: "Declares a resistor. The name prop uniquely identifies it; resistance and footprint are required.",
    example: `<resistor
  name="R1"
  resistance="1k"
  footprint="0402"
  pcbX={-6}
  pcbY={0}
/>`,
  },
  {
    tag: "<led>",
    desc: "Declares an LED. Specify its color and footprint alongside a unique name.",
    example: `<led
  name="LED1"
  color="red"
  footprint="0603"
  pcbX={6}
  pcbY={0}
/>`,
  },
  {
    tag: "<capacitor>",
    desc: "Declares a capacitor. capacitance and footprint are required properties.",
    example: `<capacitor
  name="C1"
  capacitance="10uF"
  footprint="0805"
/>`,
  },
  {
    tag: "<trace>",
    desc: "Defines a copper connection between two endpoints. The from and to props reference either a component pin or a shared net.",
    example: `<trace name="T1" from="net.VCC" to=".R1 > .pin1" />
<trace name="T2" from=".R1 > .pin2" to=".LED1 > .anode" />`,
  },
  {
    tag: "net.NAME",
    desc: "References a shared electrical net, such as power (VCC) or ground (GND). Any component referencing the same net name is electrically joined together.",
    example: `<trace name="T3" from="net.GND" to=".LED1 > .cathode" />`,
  },
  {
    tag: "pcbX / pcbY",
    desc: "Sets a component's position on the PCB layout, in millimeters, relative to the board's center.",
    example: `pcbX={-6} pcbY={0}`,
  },
  {
    tag: "footprint",
    desc: "Specifies the physical package size of a component — for example 0402, 0603, or 0805. Smaller designators indicate smaller physical packages.",
    example: `footprint="0603"`,
  },
]

export function Cheatsheet({ onClose }: CheatsheetProps) {
  return (
    <div className="cheatsheet-overlay" onClick={onClose}>
      <aside
        className="cheatsheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="VyomLang syntax reference"
      >
        <div className="cheatsheet-header">
          <div>
            <div className="cheatsheet-eyebrow">Syntax reference</div>
            <h2>VyomLang</h2>
          </div>
          <button className="cheatsheet-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <p className="cheatsheet-intro">
          VyomLang is a component-based language for describing printed
          circuit boards. Each physical part is expressed as a tag, and each
          electrical connection is expressed as a trace. Every design must be
          wrapped in <code>circuit.add(...)</code>, or the build will fail.
          The reference below covers the core building blocks.
        </p>

        <div className="cheatsheet-list">
          {ENTRIES.map((entry) => (
            <div className="cheatsheet-entry" key={entry.tag}>
              <div className="cheatsheet-tag">{entry.tag}</div>
              <p className="cheatsheet-desc">{entry.desc}</p>
              <pre className="cheatsheet-example">
                <code>{entry.example}</code>
              </pre>
            </div>
          ))}
        </div>
      </aside>
    </div>
  )
}
