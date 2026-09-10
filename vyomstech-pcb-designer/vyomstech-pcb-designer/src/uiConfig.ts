export const uiConfig = {
  brand: {
    name: "VyomsTech",
    product: "PCB Designer",
  },
  topbar: {
    new: "New",
    save: "Save",
    saved: "Saved",
    boards: "Boards",
    templates: "Templates",
    bom: "BOM",
    simulation: "Simulation",
    audio: "Audio test",
    syntax: "VyomLang syntax",
    ai: "Trace AI",
    download: "Download",
  },
  viewTabs: [
    { id: "pcb", label: "PCB" },
    { id: "schematic", label: "Schematic" },
    { id: "threeD", label: "3D" },
  ],
} as const
