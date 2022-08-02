import { colorHexToRgb } from './colorHexToRgb.js'
import { colorRgbToHsl } from './colorRgbToHsl.js'

export const colorHexToHsl = (hex) => {
	const result = colorHexToRgb(hex)

	return colorRgbToHsl(result.r, result.g, result.b)
}
