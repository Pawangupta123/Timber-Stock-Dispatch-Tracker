// CFT = (Width × Thickness × Length × Pieces) / 144
export function calculateCFT(
  widthInch: number,
  thicknessInch: number,
  lengthFeet: number,
  pieces: number
): number {
  if (!pieces || pieces <= 0) return 0
  return (widthInch * thicknessInch * lengthFeet * pieces) / 144
}

// All width rows: 1.50 to 15.00 in 0.25 steps
export const WIDTH_ROWS: number[] = []
for (let w = 1.5; w <= 15.0; w = Math.round((w + 0.25) * 100) / 100) {
  WIDTH_ROWS.push(w)
}

// Length columns: 4 to 13 feet
export const LENGTH_COLS = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13]

// Format width as fraction string (e.g., 1.5 → "1½", 2.25 → "2¼")
export function formatWidth(width: number): string {
  const whole = Math.floor(width)
  const decimal = Math.round((width - whole) * 100)

  const fractionMap: Record<number, string> = {
    0: '',
    25: '¼',
    50: '½',
    75: '¾',
  }

  const fraction = fractionMap[decimal] ?? ''
  return whole === 0 ? fraction : `${whole}${fraction}`
}

// Round CFT to 3 decimal places
export function roundCFT(value: number): number {
  return Math.round(value * 1000) / 1000
}
