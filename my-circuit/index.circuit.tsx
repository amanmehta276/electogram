// import React from "react"

// export default () => (
//   <board width="40mm" height="30mm">

//     <resistor 
//       name="R1" 
//       resistance="220ohm" 
//       footprint="0805"
//       pcbX={0}
//       pcbY={10}
//     />

//     <led 
//       name="LED1" 
//       color="red" 
//       footprint="0603"
//       pcbX={0}
//       pcbY={-10}
//     />

//     <trace from="net.VCC" to=".R1 > .pin1" />
//     <trace from=".R1 > .pin2" to=".LED1 > .pin1" />
//     <trace from=".LED1 > .pin2" to="net.GND" />
//   </board>
// )

import React from "react";

// export default function PCB() {
//   return (
//     <board width="50mm" height="40mm">

//       <resistor 
//         name="R1" 
//         resistance="220ohm" 
//         footprint="0805"
//         pcbX={-5}
//         pcbY={10}
//       />

//       <led 
//         name="LED1" 
//         color="red" 
//         footprint="0603"
//         pcbX={5}
//         pcbY={-10}
//       />

//       <capacitor
//         name="C1"
//         capacitance="10uF"
//         footprint="0805"
//         pcbX={10}
//         pcbY={10}
//       />

//       {/* main circuit */}
//       <trace from="net.VCC" to="R1.pin1" />
//       <trace from="R1.pin2" to="LED1.pin1" />
//       <trace from="LED1.pin2" to="net.GND" />

//       {/* capacitor (parallel) */}
//       <trace from="net.VCC" to="C1.pin1" />
//       <trace from="C1.pin2" to="net.GND" />

//     </board>
//   );
// }

const Circuit = () => (
  <board width="50mm" height="50mm" center_x={0} center_y={0}>
    <MySubcomponent name="U1" center={[0, 0]} footprint="sot236" />
    <resistor
      x={2}
      y={-0.5}
      name="R1"
      resistance="10ohm"
      footprint="0805"
      pcb_x="4mm"
      pcb_y="-1mm"
    />
    <ground x={3} y={1} name="GND" />
    <trace path={[".U1 > .D0", ".R1 > .left"]} />
    <trace path={[".R1 > .right", ".GND > .gnd"]} />
  </board>
)