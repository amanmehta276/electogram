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

export default function PCB() {
  return (
    <board width="50mm" height="40mm">

      <resistor 
        name="R1" 
        resistance="220ohm" 
        footprint="0805"
        pcbX={-5}
        pcbY={10}
      />

      <led 
        name="LED1" 
        color="red" 
        footprint="0603"
        pcbX={5}
        pcbY={-10}
      />

      <capacitor
        name="C1"
        capacitance="10uF"
        footprint="0805"
        pcbX={10}
        pcbY={10}
      />

      {/* main circuit */}
      <trace from="net.VCC" to="R1.pin1" />
      <trace from="R1.pin2" to="LED1.pin1" />
      <trace from="LED1.pin2" to="net.GND" />

      {/* capacitor (parallel) */}
      <trace from="net.VCC" to="C1.pin1" />
      <trace from="C1.pin2" to="net.GND" />

    </board>
  );
}