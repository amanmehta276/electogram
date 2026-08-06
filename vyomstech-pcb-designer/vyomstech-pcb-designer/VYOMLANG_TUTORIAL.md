# VyomLang Tutorial

VyomLang is the component language used by **VyomsTech PCB Designer**. It's
built on top of the open-source `tscircuit` engine — you describe a circuit
using JSX-style tags, and the app renders a live PCB, schematic, and 3D
model, and can export real manufacturing files.

This tutorial covers every component type, real examples, and the exact
errors you'll hit if you get something wrong (and how to fix them).

---

## 1. The Golden Rule

Every single design **must** be wrapped in `circuit.add(...)`. This is not
optional — without it, the build fails immediately.

```tsx
circuit.add(
  <board width="30mm" height="20mm">
    {/* everything goes in here */}
  </board>
)
```

If you ever see the error:

```
Not able to guess root component: IsolatedCircuit has no children
```

...it means you forgot `circuit.add(...)`, or you used
`export default () => (...)` instead (which sometimes works, sometimes
doesn't depending on engine version — `circuit.add(...)` is the reliable,
version-independent way to write it).

---

## 2. The Board

Every circuit starts with exactly one `<board>`. It sets the physical
outline.

```tsx
<board width="30mm" height="20mm">
  {/* components go here */}
</board>
```

---

## 3. Passive Components

### Resistor

```tsx
<resistor name="R1" resistance="1k" footprint="0402" pcbX={-6} pcbY={0} />
```

### Capacitor

```tsx
<capacitor name="C1" capacitance="10uF" footprint="0805" pcbX={6} pcbY={0} />
```

### Inductor

```tsx
<inductor name="L1" inductance="10uH" footprint="0603" />
```

**⚠️ Gotcha:** if you set `pcbX`/`pcbY` on a component, it **must** also have
a `footprint`. Leaving footprint off while setting a position throws:

```
Execution Error: <Component> requires a footprint when pcbX/pcbY
or pcb edge position props are used
```

This applies to resistors, capacitors, voltage sources — basically anything
you're placing on the board.

---

## 4. LED & Diode

### LED

```tsx
<led name="LED1" color="red" footprint="0603" pcbX={6} pcbY={0} />
```

Connect via `.anode` / `.cathode`:

```tsx
<trace name="T1" from=".R1 > .pin2" to=".LED1 > .anode" />
<trace name="T2" from=".LED1 > .cathode" to="net.GND" />
```

### Diode

```tsx
<diode
  name="D1"
  variant="schottky"   // or "standard", "zener", "avalanche", "photo"
  footprint="sod123"
  connections={{ anode: "net.VIN", cathode: "net.VOUT" }}
/>
```

---

## 5. Transistor & MOSFET

```tsx
<transistor name="Q1" type="npn" footprint="sot23" />
```
`type` can be `npn`, `pnp`, `bjt`, `jfet`, `mosfet`, or `igbt`.

```tsx
<mosfet
  name="Q1"
  channelType="n"           // or "p"
  mosfetMode="enhancement"  // or "depletion"
  footprint="sot23"
/>
```

---

## 6. Power Components

### Battery

```tsx
<battery
  name="BAT1"
  voltage="3.7"
  standard="18650"   // AA, AAA, 9V, CR2032, 18650, C
  connections={{ pos: "net.VBAT", neg: "net.GND" }}
/>
```

### Voltage Source (for simulation)

```tsx
<voltagesource
  name="V1"
  voltage="5"
  footprint="0402"   // required if you set pcbX/pcbY!
  connections={{ pin1: "net.VCC", pin2: "net.GND" }}
/>
```

---

## 7. Connectors & Headers

### Pin Header

The most reliable way to break signals out to an external board (like an
Arduino or Pro Micro):

```tsx
<pinheader
  name="J1"
  pinCount={6}
  pitch="2.54mm"
  gender="male"       // or "female", "unpopulated"
  pinLabels={["VCC", "GND", "ROW0", "ROW1", "COL0", "COL1"]}
/>
```

### Connector

```tsx
<connector name="J1" standard="usb_c" />
```

### Jumper

```tsx
<jumper name="JP1" footprint="pinrow2" />
```

---

## 8. Timing Components

```tsx
<crystal name="Y1" frequency="16MHz" loadCapacitance="18pF" />
<resonator name="Y2" frequency="8MHz" loadCapacitance="15pF" />
```

---

## 9. Buttons & Switches

**⚠️ Important gotcha:** `<switch footprint="...">` requires a very specific
footprinter-string syntax — casual strings like `"smd_button_6x6"` will
fail with:

```
Invalid footprint function, got "smd", from string "smd_button_6x6"
```

**For a simple momentary press button (keyboard keys, reset buttons), use
`<pushbutton>` instead — it's a dedicated, well-documented component:**

```tsx
<pushbutton name="SW1" footprint="pushbutton" pcbX={0} pcbY={0} />
```

Its two pins (`pin1`, `pin2`) are two access points to the *same* electrical
contact — you only need to use one from each "side" of the button.

For a switch you plan to control **inside a simulation** (auto-opening/
closing at a specific time, no physical footprint needed), `<switch>` still
works fine without a footprint:

```tsx
<switch
  name="SW1"
  simStartOpen={true}
  simCloseAt="5ms"
  connections={{ pin1: "net.VCC", pin2: "net.MID" }}
/>
```

### Potentiometer

```tsx
<potentiometer name="POT1" maxResistance="10k" footprint="pot_9mm" />
```

---

## 10. Protection

```tsx
<fuse name="F1" currentRating="500mA" footprint="0603" />
```

---

## 11. Analog & Test

```tsx
<opamp name="U1" footprint="soic8" />
<testpoint name="TP1" footprintVariant="pad" padShape="circle" />
```

---

## 12. Traces & Nets

A `<trace>` connects two things — a component pin, or a shared `net`.

```tsx
<trace name="T1" from="net.VCC" to=".R1 > .pin1" />
<trace name="T2" from=".R1 > .pin2" to=".LED1 > .anode" />
```

**Always name your traces** (`name="T1"`). Unnamed traces don't break the
build, but they throw a warning for every single one:

```
source_unnamed_trace_warning: <trace ...> is missing a name.
```

Nets (`net.VCC`, `net.GND`, or any custom name like `net.ROW0`) let you
connect many things together without drawing a trace between every pair —
anything referencing the same net name is electrically joined.

---

## 13. Positioning

- `pcbX` / `pcbY` — position in millimeters, measured from the board center
- `footprint` — physical package size (`"0402"`, `"0603"`, `"0805"`, etc.)
  — required whenever you set a position

---

## 14. Simulation (real SPICE, backed by ngspice)

```tsx
<voltagesource name="V1" voltage="5" footprint="0402"
  connections={{ pin1: "net.VCC", pin2: "net.GND" }} />
<voltageprobe name="Vout_probe" connectsTo=".C1 > .pin1" />
<analogtransientsimulation duration="20ms" />
```

**Gotcha:** `<voltageprobe>`'s `connectsTo` needs a **specific component
pin**, not a bare net name:

```tsx
// ❌ fails: "Could not identify connected source for VoltageProbe"
<voltageprobe connectsTo="net.VOUT" />

// ✅ works
<voltageprobe connectsTo=".C1 > .pin1" />
```

Note: the app's own PCB/Schematic/3D preview does **not** show a simulation
graph tab. Use the app's "📈 Simulation" button to render the actual graph
separately.

---

## 15. Full Worked Examples

### LED + Resistor (simplest possible circuit)

```tsx
circuit.add(
  <board width="30mm" height="20mm">
    <resistor name="R1" resistance="1k" footprint="0402" pcbX={-6} pcbY={0} />
    <led name="LED1" color="red" footprint="0603" pcbX={6} pcbY={0} />
    <trace name="T1" from="net.VCC" to=".R1 > .pin1" />
    <trace name="T2" from=".R1 > .pin2" to=".LED1 > .anode" />
    <trace name="T3" from=".LED1 > .cathode" to="net.GND" />
  </board>
)
```

### RC Low-Pass Filter (cuts high frequencies)

```tsx
circuit.add(
  <board width="25mm" height="15mm">
    <resistor name="R1" resistance="1k" footprint="0402" pcbX={-5} pcbY={0} />
    <capacitor name="C1" capacitance="100nF" footprint="0402" pcbX={5} pcbY={0} />
    <trace name="T1" from="net.AUDIO_IN" to=".R1 > .pin1" />
    <trace name="T2" from=".R1 > .pin2" to="net.AUDIO_OUT" />
    <trace name="T3" from="net.AUDIO_OUT" to=".C1 > .pin1" />
    <trace name="T4" from=".C1 > .pin2" to="net.GND" />
  </board>
)
```

### RC High-Pass Filter (cuts low frequencies)

Same parts, order swapped:

```tsx
circuit.add(
  <board width="25mm" height="15mm">
    <capacitor name="C1" capacitance="100nF" footprint="0402" pcbX={-5} pcbY={0} />
    <resistor name="R1" resistance="1k" footprint="0402" pcbX={5} pcbY={0} />
    <trace name="T1" from="net.AUDIO_IN" to=".C1 > .pin1" />
    <trace name="T2" from=".C1 > .pin2" to="net.AUDIO_OUT" />
    <trace name="T3" from="net.AUDIO_OUT" to=".R1 > .pin1" />
    <trace name="T4" from=".R1 > .pin2" to="net.GND" />
  </board>
)
```

### Button-Controlled LED

```tsx
circuit.add(
  <board width="20mm" height="15mm">
    <pushbutton name="SW1" footprint="pushbutton" pcbX={0} pcbY={0} />
    <resistor name="R1" resistance="10k" footprint="0402" pcbX={-8} pcbY={0} />
    <led name="LED1" color="blue" footprint="0603" pcbX={8} pcbY={0} />
    <trace name="T1" from="net.VCC" to=".SW1 > .pin1" />
    <trace name="T2" from=".SW1 > .pin2" to=".R1 > .pin1" />
    <trace name="T3" from=".R1 > .pin2" to=".LED1 > .anode" />
    <trace name="T4" from=".LED1 > .cathode" to="net.GND" />
  </board>
)
```

### Key Matrix (macropad / keyboard building block)

Generated in a loop — scale `ROWS`/`COLS` to whatever size you want.

```tsx
const ROWS = 3
const COLS = 3
const PITCH = 19 // mm, standard keycap spacing

const keys = []
for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    const swName = `SW${r}${c}`
    const dName = `D${r}${c}`
    const x = (c - (COLS - 1) / 2) * PITCH
    const y = (r - (ROWS - 1) / 2) * PITCH

    keys.push(<pushbutton key={swName} name={swName} footprint="pushbutton" pcbX={x} pcbY={y - 4} />)
    keys.push(<diode key={dName} name={dName} variant="standard" footprint="sod123" pcbX={x} pcbY={y + 4} />)
    keys.push(<trace key={`tsd${r}${c}`} name={`T_SWD_${r}${c}`} from={`.${swName} > .pin2`} to={`.${dName} > .anode`} />)
    keys.push(<trace key={`tdr${r}${c}`} name={`T_DROW_${r}${c}`} from={`.${dName} > .cathode`} to={`net.ROW${r}`} />)
    keys.push(<trace key={`tsc${r}${c}`} name={`T_SWCOL_${r}${c}`} from={`.${swName} > .pin1`} to={`net.COL${c}`} />)
  }
}

circuit.add(
  <board width="70mm" height="70mm">
    {keys}
    <pinheader name="J1" pinCount={6} pitch="2.54mm" gender="male" pcbX={0} pcbY={-32} />
  </board>
)
```

---

## 16. Common Errors — Quick Reference

| Error message contains… | What it means | Fix |
|---|---|---|
| `IsolatedCircuit has no children` | Forgot `circuit.add(...)` | Wrap your whole design in `circuit.add(...)` |
| `requires a footprint when pcbX/pcbY` | Positioned a part without giving it a footprint | Add a `footprint` prop |
| `Invalid footprint function` | Used a made-up footprint string | Stick to known strings (`0402`, `0603`, `sod123`, `pushbutton`, `soic8`...) or ask for the right one |
| `is missing a name` (trace warning) | A `<trace>` has no `name` prop | Add `name="T1"` etc. — harmless but noisy if skipped |
| `Failed to fetch supplier footprint` | The engine tried to look up a real supplier part and the network call failed | Usually harmless for prototyping; ignore unless the board looks visibly wrong |
| `Could not identify connected source for VoltageProbe` | `connectsTo` pointed at a bare net instead of a pin | Use `.Component > .pin` instead of `net.NAME` |
| `Rendered fewer hooks than expected` (in the app, not your code) | A React internal glitch, usually from rapid re-renders | Use the "▶ Run" button instead of typing continuously; this is a tool-level quirk, not a circuit mistake |

---

## 17. From Design to Real Board

1. Write your circuit, hit **▶ Run**
2. Check the **PCB / Schematic / 3D** tabs look right
3. **Download → Gerbers (.zip)** — this is the manufacturing file set
4. Upload that zip to **JLCPCB** or **PCBWay**, pick quantity/color, order
5. Solder your components onto the board once it arrives

That's the whole loop — code in, real hardware out.
