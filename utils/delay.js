export const delay = (milliseconds) =>
	new Promise((resolve) =>
		setTimeout(() => {
			resolve(undefined)
		}, milliseconds),
	)
