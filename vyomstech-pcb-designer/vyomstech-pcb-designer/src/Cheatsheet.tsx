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
    desc: "Declares a resistor. resistance and footprint are required.",
    example: `<resistor
  name="R1"
  resistance="1k"
  footprint="0402"
  pcbX={-6}
  pcbY={0}
/>`,
  },
  {
    tag: "<capacitor>",
    desc: "Declares a capacitor. capacitance and footprint are required.",
    example: `<capacitor
  name="C1"
  capacitance="10uF"
  footprint="0805"
/>`,
  },
  {
    tag: "<inductor>",
    desc: "Declares an inductor. inductance is required.",
    example: `<inductor
  name="L1"
  inductance="10uH"
  footprint="0603"
/>`,
  },
  {
    tag: "<led>",
    desc: "Declares an LED. color and footprint are required alongside a unique name.",
    example: `<led
  name="LED1"
  color="red"
  footprint="0603"
  pcbX={6}
  pcbY={0}
/>`,
  },
  {
    tag: "<diode>",
    desc: "Declares a diode. variant selects the type (standard, schottky, zener, avalanche, photo, tvs). Connect via anode/cathode.",
    example: `<diode
  name="D1"
  variant="schottky"
  footprint="sod123"
  connections={{ anode: "net.VIN", cathode: "net.VOUT" }}
/>`,
  },
  {
    tag: "<transistor>",
    desc: "Declares a bipolar transistor. type is required: npn, pnp, bjt, jfet, mosfet, or igbt.",
    example: `<transistor
  name="Q1"
  type="npn"
  footprint="sot23"
/>`,
  },
  {
    tag: "<mosfet>",
    desc: "Declares a MOSFET. channelType (n or p) and mosfetMode (enhancement or depletion) are required.",
    example: `<mosfet
  name="Q1"
  channelType="n"
  mosfetMode="enhancement"
  footprint="sot23"
/>`,
  },
  {
    tag: "<battery>",
    desc: "Declares a battery. voltage, capacity, and standard (AA, AAA, 9V, CR2032, 18650, C) are optional. Connect via pos/neg.",
    example: `<battery
  name="BAT1"
  voltage="3.7"
  standard="18650"
  connections={{ pos: "net.VBAT", neg: "net.GND" }}
/>`,
  },
  {
    tag: "<connector>",
    desc: "Declares a connector. standard selects a known type, e.g. usb_c or m2.",
    example: `<connector
  name="J1"
  standard="usb_c"
/>`,
  },
  {
    tag: "<pinheader>",
    desc: "Declares a pin header. pinCount is required; pitch and gender (male, female, unpopulated) are optional.",
    example: `<pinheader
  name="J2"
  pinCount={4}
  pitch="2.54mm"
  gender="male"
/>`,
  },
  {
    tag: "<crystal>",
    desc: "Declares a crystal oscillator. frequency and loadCapacitance are required.",
    example: `<crystal
  name="Y1"
  frequency="16MHz"
  loadCapacitance="18pF"
/>`,
  },
  {
    tag: "<resonator>",
    desc: "Declares a ceramic resonator. frequency and loadCapacitance are required.",
    example: `<resonator
  name="Y2"
  frequency="8MHz"
  loadCapacitance="15pF"
/>`,
  },
  {
    tag: "<potentiometer>",
    desc: "Declares a potentiometer. maxResistance is required.",
    example: `<potentiometer
  name="POT1"
  maxResistance="10k"
  footprint="pot_9mm"
/>`,
  },
  {
    tag: "<switch>",
    desc: "Declares a switch or pushbutton. type selects spst, spdt, dpst, or dpdt.",
    example: `<switch
  name="SW1"
  type="spst"
  footprint="smd_button_6x6"
/>`,
  },
  {
    tag: "<fuse>",
    desc: "Declares a fuse. currentRating is required; voltageRating is optional.",
    example: `<fuse
  name="F1"
  currentRating="500mA"
  footprint="0603"
/>`,
  },
  {
    tag: "<jumper>",
    desc: "Declares a jumper (a manual bridge between pins, often used for configuration).",
    example: `<jumper
  name="JP1"
  footprint="pinrow2"
/>`,
  },
  {
    tag: "<opamp>",
    desc: "Declares an operational amplifier. Connect its pins (inputs, output, power) via connections.",
    example: `<opamp
  name="U1"
  footprint="soic8"
/>`,
  },
  {
    tag: "<testpoint>",
    desc: "Declares a test point — a probe-accessible pad for debugging or measurement.",
    example: `<testpoint
  name="TP1"
  footprintVariant="pad"
  padShape="circle"
/>`,
  },
  {
    tag: "<voltagesource>",
    desc: "Declares a voltage source, used for simulation. footprint is required if pcbX/pcbY are set. Connect via pin1/pin2 (or pos/neg).",
    example: `<voltagesource
  name="V1"
  voltage="5"
  footprint="0402"
  connections={{ pin1: "net.VCC", pin2: "net.GND" }}
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
          The reference below covers every available component.
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
