// Based on https://gist.github.com/xenozauros/f6e185c8de2a04cdfecf
export const colorHexToRgb = (hex) => {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
	if (result === null) {
		throw new Error(`${hex} is not hex color`)
	}
	const r = parseInt(result[1], 16)
	const g = parseInt(result[2], 16)
	const b = parseInt(result[3], 16)

	return { r, g, b }
}
