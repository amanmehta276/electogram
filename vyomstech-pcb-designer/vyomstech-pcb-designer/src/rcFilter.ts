const UNIT_MULTIPLIERS: Record<string, number> = {
  p: 1e-12,
  n: 1e-9,
  u: 1e-6,
  "µ": 1e-6,
  m: 1e-3,
  "": 1,
  k: 1e3,
  M: 1e6,
  G: 1e9,
}

/** Parses engineering-notation values like "150", "1k", "47uF", "100nF". */
export function parseEngineeringValue(raw: string | undefined): number | null {
  if (!raw) return null
  const match = raw.trim().match(/^([\d.]+)\s*([pnuµmkMG]?)/)
  if (!match) return null
  const num = Number.parseFloat(match[1])
  if (Number.isNaN(num)) return null
  const mult = UNIT_MULTIPLIERS[match[2] ?? ""] ?? 1
  return num * mult
}

export interface RcValues {
  resistanceOhms: number | null
  capacitanceFarads: number | null
  cutoffHz: number | null
}

/** Extracts the first resistance/capacitance found in a VyomLang source string. */
export function extractRcFromCode(code: string): RcValues {
  const rMatch = code.match(/resistance=["']([^"']+)["']/)
  const cMatch = code.match(/capacitance=["']([^"']+)["']/)

  const resistanceOhms = parseEngineeringValue(rMatch?.[1])
  const capacitanceFarads = parseEngineeringValue(cMatch?.[1])

  const cutoffHz =
    resistanceOhms && capacitanceFarads
      ? 1 / (2 * Math.PI * resistanceOhms * capacitanceFarads)
      : null

  return { resistanceOhms, capacitanceFarads, cutoffHz }
}
