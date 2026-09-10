export const uiTheme = {
  palette: {
    background: "#08120e",
    panel: "#0e2119",
    panelRaised: "#12291f",
    accent: "#d69a5c",
    accentSoft: "#f0b878",
    text: "#eef1ec",
    muted: "#9db3a8",
    success: "#4ade80",
    danger: "#f26d5b",
    hairline: "#1e3a2c",
  },
  fonts: {
    display: "'Space Mono', 'JetBrains Mono', monospace",
    body: "'IBM Plex Sans', system-ui, sans-serif",
  },
  radius: {
    sm: "4px",
    md: "6px",
  },
  spacing: {
    xs: "6px",
    sm: "8px",
    md: "12px",
    lg: "18px",
    xl: "24px",
  },
} as const

export const appThemeStyle = {
  ["--board-void" as string]: uiTheme.palette.background,
  ["--board-mask" as string]: uiTheme.palette.panel,
  ["--board-mask-raised" as string]: uiTheme.palette.panelRaised,
  ["--copper" as string]: uiTheme.palette.accent,
  ["--copper-bright" as string]: uiTheme.palette.accentSoft,
  ["--silkscreen" as string]: uiTheme.palette.text,
  ["--silkscreen-dim" as string]: uiTheme.palette.muted,
  ["--signal-green" as string]: uiTheme.palette.success,
  ["--signal-red" as string]: uiTheme.palette.danger,
  ["--hairline" as string]: uiTheme.palette.hairline,
  ["--font-display" as string]: uiTheme.fonts.display,
  ["--font-body" as string]: uiTheme.fonts.body,
} as React.CSSProperties
