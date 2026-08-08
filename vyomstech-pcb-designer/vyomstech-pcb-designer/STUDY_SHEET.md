# VyomsTech PCB Designer — Study Sheet

Ye sheet tere apne samajhne ke liye hai — poora project, ek jagah, simple bhasha me.

---

## 1. Ye Project Hai Kya

**VyomsTech PCB Designer** — ek browser-based tool jisme:
- Code likh ke PCB (Printed Circuit Board) design banta hai
- Live preview milta hai — PCB layout, Schematic diagram, 3D model
- Real electrical simulation ho sakti hai
- Real manufacturing files (Gerber) export ho sakti hain — actual factory se board banwa sakte ho
- Audio filter circuits ko real audio se test kar sakte ho

**Koi installation nahi chahiye** — sab browser me chalta hai.

---

## 2. Do Alag Duniya — React aur tscircuit

Ye samajhna sabse zaroori hai. **Do completely alag systems** hain jo ek dusre se juде hain:

### React (humara apna code)
- UI banata hai — buttons, editor, panels, sab kuch
- Humne khud likha hai (`App.tsx`, `Cheatsheet.tsx`, etc.)
- Isko PCB/circuit ke baare me kuch nahi pata

### tscircuit (open-source engine)
- Actual circuit ka "dimaag" — layout calculate karta hai, PCB banata hai
- Humne nahi banaya — ek open-source library hai jo humne use ki
- Isko React ke baare me kuch nahi pata

### Bridge — `RunFrame` component
- Ye dono ko jodta hai
- Humara code isse bas do cheezein deta hai: `fsMap` (code) aur `entrypoint`
- Wapas humein milta hai: Circuit JSON (data) callbacks ke through

**Flow ek line me:**
```
Tu type karta hai
  → React state update hota hai
  → "Run" dabane pe RunFrame ko naya code milta hai
  → RunFrame ek Web Worker banata hai (alag thread, crash-safe)
  → Worker ke andar @tscircuit/eval code ko COMPILE + RUN karta hai
  → @tscircuit/core layout/position/routing CALCULATE karta hai
  → Result: Circuit JSON (sirf numbers/data, koi image nahi)
  → RunFrame is JSON se PCB/Schematic/3D draw karta hai
  → Humara onCircuitJsonChange callback fire hota hai
  → Humare apne features (Download, Audio Test, Simulation) is JSON ko use karte hain
```

**Web Worker kyun?** Agar tere code me bug ho, sirf worker crash hota hai — poora app freeze nahi hota. Safety ke liye.

**"Model" kya hai?** Koi AI/ML model nahi hai yahan — `@tscircuit/core` ek **deterministic algorithm** hai (jaise calculator), training/prediction nahi karta, pure math/logic se layout banata hai.

---

## 3. VyomLang — Circuit Likhne Ka Tarika

VyomLang asal me **tscircuit ka JSX syntax hai, bas humne branding di hai** (naam badla, cheatsheet banayi). Engine wahi hai.

### Golden Rule
Har circuit `circuit.add(...)` ke andar hona chahiye:
```tsx
circuit.add(
  <board width="30mm" height="20mm">
    {/* sab kuch yahan */}
  </board>
)
```

### Basic Pattern
1. Board banao (`<board>`)
2. Components daalo (`<resistor>`, `<led>`, etc.) — position (`pcbX`/`pcbY`) aur size (`footprint`) do
3. Traces se connect karo (`<trace from="..." to="..." />`)
4. Common connections ke liye `net.NAME` use karo (jaise `net.VCC`, `net.GND`)

### Sabse zaroori components (jo baar-baar use honge)
- `resistor`, `capacitor`, `inductor` — passive parts
- `led`, `diode` — anode/cathode se connect hote hain
- `pushbutton` — button ke liye (switch nahi, isme footprint problem aati hai)
- `battery`, `voltagesource` — power source
- `pinheader` — external microcontroller se connect karne ke liye

*(Poori list "VyomLang syntax" button me app ke andar hi hai)*

---

## 4. App Ke Features — Kya-Kya Bana Hai

### Design & Editor
- Monaco code editor (VS Code jaisa)
- "▶ Run" button — manual control, auto-build nahi hota
- PCB/Schematic/3D live preview

### Project Management
- Save/Load multiple boards (browser me hi, `localStorage`)
- New/Save/Boards controls

### Export (Download menu)
- Code (`.tsx`)
- PCB/Schematic (`.svg`)
- Circuit JSON (raw data)
- **Gerbers (`.zip`)** — real manufacturing files, JLCPCB/PCBWay pe order karne ke liye

### Simulation
- Real SPICE simulation (`ngspice` backed) — voltage/current time ke saath kaise badalta hai
- **Important**: RunFrame ka apna preview isse tab me nahi dikhata — humne khud "📈 Simulation" panel banaya jo graph nikal ke dikhata hai

### Audio Test (unique feature)
- Circuit ke R aur C values se cutoff frequency calculate karta hai
- Low-pass/High-pass filter select kar sakte ho
- File upload ya live voice record karke asli audio filter se pass kar sakte ho
- Waveform graphs (input vs output) dikhte hain
- Live mic monitoring bhi hai (headphones zaroori, feedback se bachne ke liye)

---

## 5. Zaroori Baat — Ye Interactive Simulator Nahi Hai

**Bahut important confusion clear karna:**

| Ye tool | Interactive simulator (Wokwi/Tinkercad) |
|---|---|
| Design **kaisa dikhega** wo banata hai | Design **live kaise behave karega** dikhata hai |
| Click karke button daba nahi sakte | Click karke test kar sakte ho |
| Manufacturing ke liye | Sirf learning/testing ke liye |

Simulation yahan **pre-calculated graph** deta hai (jaise "5ms pe switch band hua to voltage aise badla"), lekin tu **live click nahi kar sakta**. Agar wo chahiye, Wokwi.com alag tool hai.

---

## 6. Common Errors — Yaad Rakhne Layak

| Error | Matlab | Fix |
|---|---|---|
| `IsolatedCircuit has no children` | `circuit.add()` bhool gaya | Wrap kar do |
| `requires a footprint when pcbX/pcbY` | Position diya, footprint nahi diya | `footprint` add karo |
| `Invalid footprint function` | Galat footprint string (jaise `smd_button_6x6`) | Known strings use karo (`0402`, `pushbutton`, etc.) |
| `trace is missing a name` | Trace ko naam nahi diya | `name="T1"` add karo (warning hai, error nahi) |
| `Could not identify connected source for VoltageProbe` | `connectsTo` me bare net diya | Specific pin do (`.C1 > .pin1`) |

---

## 7. Ab Tak Ke Real Circuits (jo bana chuke hain)

1. LED + Resistor — basic circuit
2. Dual LED status indicator — 2 independent LED branches + capacitor
3. RC Low-pass filter — audio se high frequencies hatana
4. RC High-pass filter — audio se low frequencies hatana
5. RC transient simulation — voltage-vs-time real graph
6. Button-controlled LED
7. 24-key Macropad — pushbutton + diode matrix, pinheader breakout

---

## 8. Design se Real Board Tak (poora process)

1. Circuit likho, "▶ Run" daba
2. PCB/Schematic/3D check karo
3. Download → Gerbers (.zip)
4. JLCPCB.com ya PCBWay.com pe zip upload karo
5. Quantity/color select karo, order karo
6. 5-10 din me bare PCB ghar aayega
7. Components khud solder karo (ya assembly service use karo)

---

## 9. Tech Stack (agar koi puche "kis se bana hai")

- **Frontend**: React + TypeScript + Vite
- **Circuit Engine**: tscircuit (`@tscircuit/core`, `@tscircuit/eval`, `@tscircuit/runframe`)
- **Editor**: Monaco Editor
- **Export**: `circuit-to-svg`, `circuit-json-to-gerber`, `jszip`
- **Audio**: Web Audio API (`BiquadFilterNode`, `MediaRecorder`, `getUserMedia`)
- **Storage**: Browser `localStorage`
- **Underlying simulation**: WebAssembly ngspice

---

## 10. Agar Koi Poochhe "Ye Kya Hai" — Ek-Line Answer

> "Ek browser-based PCB design tool jisme code se PCB banate hain, real electrical simulation kar sakte hain, aur seedha manufacturing files export kar ke real board banwa sakte hain — koi installation ke bina."
