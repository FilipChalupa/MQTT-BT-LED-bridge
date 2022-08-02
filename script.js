import { colorHexToHsl } from './utils/colorHexToHsl.js'
import { delay } from './utils/delay.js'

const lights = [
	{
		mac: 'C2:BF:C7:30:AA:F3',
		element: document.querySelector('.light'),
		bluetoothCharacteristic: null,
		color: '#000000',
	},
	{
		mac: 'EC:C7:10:29:B1:22',
		element: document.querySelector('.light + .light'),
		bluetoothCharacteristic: null,
		color: '#000000',
	},
]

const sendColorCommand = async (bluetoothCharacteristic, hsl) => {
	const prefixByte = 0x78
	const tagByte = 0x86
	const hueAByte = hsl.h & 0xff
	const hueBByte = (hsl.h & 0xff00) >> 8
	const saturationByte = hsl.s
	const lightnessByte = hsl.l
	const byteCountByte = 0x04
	const payloadWithoutChecksum = new Uint8Array([
		prefixByte,
		tagByte,
		byteCountByte,
		hueAByte,
		hueBByte,
		saturationByte,
		lightnessByte,
	])
	const checksum = payloadWithoutChecksum.reduce((sum, byte) => sum + byte, 0)
	const payload = new Uint8Array(payloadWithoutChecksum.length + 1)
	payload.set(payloadWithoutChecksum, 0)
	payload.set(new Uint8Array([checksum]), payloadWithoutChecksum.length)
	await bluetoothCharacteristic.writeValue(payload)
}

const setTurnCommand = async (bluetoothCharacteristic, on) => {
	const onCommand = new Uint8Array([0x78, 0x81, 0x01, 0x01, 0xfb])
	const offCommand = new Uint8Array([0x78, 0x81, 0x01, 0x02, 0xfc])
	await bluetoothCharacteristic.writeValue(on ? onCommand : offCommand)
}

lights.forEach((light) => {
	const button = light.element.querySelector('button')
	button.addEventListener('click', async () => {
		button.textContent = 'Reconnect'
		const serviceUuid = '69400001-b5a3-f393-e0a9-e50e24dcca99'
		const characteristicUuid = '69400002-b5a3-f393-e0a9-e50e24dcca99'
		const status = light.element.querySelector('.status')

		try {
			const device = await navigator.bluetooth.requestDevice({
				filters: [{ namePrefix: 'NEEWER' }, { services: [serviceUuid] }],
			})

			status.textContent = '🔃'
			const server = await device.gatt.connect()
			const service = await server.getPrimaryService(serviceUuid)
			const characteristic = await service.getCharacteristic(characteristicUuid)
			status.textContent = '🔗'

			// Signalise connection established
			await setTurnCommand(characteristic, true)
			await delay(30)
			// Green
			await sendColorCommand(characteristic, {
				h: 117,
				s: 100,
				l: 40,
			})
			await delay(1000)

			light.bluetoothCharacteristic = characteristic
		} catch (error) {
			console.error(error)
			alert('Connection failed.')
		}
	})
})

const client = new Paho.MQTT.Client(
	'd57a0d1c39d54550b147b58411d86743.s2.eu.hivemq.cloud',
	8884,
	'a616a9ea-3f48-44ca-bbb9-f7b9df9ace1d',
)

client.onConnectionLost = onConnectionLost
client.onMessageArrived = onMessageArrived

client.connect({
	onSuccess: onConnect,
	userName: 'robot',
	password: 'P@ssW0rd!',
	useSSL: true,
})

function onConnect() {
	client.subscribe('/led-panel/1')
	client.subscribe('/led-panel/2')
}

function onConnectionLost(responseObject) {
	if (responseObject.errorCode !== 0) {
		console.log('onConnectionLost:' + responseObject.errorMessage)
	}
}

function onMessageArrived(message) {
	try {
		console.log('onMessageArrived:' + message.destinationName)
		console.log('onMessageArrived:' + message.payloadString)

		const parts = message.destinationName.split('/')

		const id = parts[parts.length - 1]
		if (
			message.payloadString.length === 7 &&
			message.payloadString.startsWith('#')
		) {
			if (id === '1') {
				lights[0].color = message.payloadString
			} else if (id === '2') {
				lights[1].color = message.payloadString
			}
		}
	} catch (error) {
		console.error(error)
	}
}

while (true) {
	for (const light of lights) {
		const hsl = colorHexToHsl(light.color)

		const color = light.element.querySelector('.color')

		color.style.setProperty('--base', `hsl(${hsl.h} ${hsl.s}% ${hsl.l}%)`)

		const { bluetoothCharacteristic: characteristic } = light
		if (characteristic) {
			try {
				await sendColorCommand(characteristic, hsl)
			} catch (error) {
				console.error(error)
			}
		}
		await delay(20)
	}
}
