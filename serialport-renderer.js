const ByteLength = require('serialport/packages/parser-byte-length')
const fs = require('fs')
const SerialPort = require('serialport/packages/serialport')
const tableify = require('tableify')
const { ByteQueue } = require('./byte-queue')
const { sleep } = require('./sleep')
// const noiseFilter = require('./noise-filter')

const manufacturerId = '2E8A'

let msgQueue = new ByteQueue()

let portIsOpen = false

function formatTime(date) {
  let month = date.getMonth() + 1
  let day = date.getDate();
  let year = date.getFullYear();
  let hours = date.getHours()
  let minutes = date.getMinutes()
  let seconds = date.getSeconds()
  if (hours < 10) {
    hours = '0' + hours
  }
  if (minutes < 10) {
    minutes = '0' + minutes
  }
  if (seconds < 10) {
    seconds = '0' + seconds
  }
  return `${month}-${day}-${year}-${hours}-${minutes}-${seconds}`
}

async function listSerialPorts() {
  await SerialPort.list().then(async (ports, err) => {
    if (err) {
      document.getElementById('error').textContent = err.message
      return
    } else {
      document.getElementById('error').textContent = ''
    }

    console.log('Ports:', ports) // DEBUG

    const validPorts = []  // list of soccer tracker ports
    ports.forEach((device) => {
      if (device.vendorId !== undefined && device.vendorId.toUpperCase() === manufacturerId) {
        validPorts.push(device)
      }
    })

    if (validPorts.length === 0) { //
      document.getElementById('error').textContent = 'No devices discovered.'
    } else if (validPorts.length !== 1) {
      document.getElementById('error').textContent =
        'More than one compatible device found.'
    } else {
      portIsOpen = true
      let port = new SerialPort(validPorts[0].path, {
        baudRate: 115200,
        autoOpen: true
      })

      // let debugQueue = new ByteQueue()
      port.pipe(new ByteLength({ length: 1 })).on('data', data => {
        msgQueue.push(data.toString('utf8'))
        // debugQueue.push(data.toString('utf8'))
        // console.log(debugQueue.queue.length, debugQueue.queue.join(''))
      })

      port.on('open', () => {
        console.log('Port opened')
      })
      port.write('flash\n')
      // await sleep(4000)
      await msgQueue.waitForBytes(4)

      document.getElementById('error').innerHTML = 'Port has connected and flashed' // debug
      port.write('sendfiles\n')

      let numFiles = Number(await msgQueue.waitForLine())  // number of files
      console.log('Number of files: ', numFiles)
      if (!fs.existsSync('sessions')) {
        fs.mkdirSync('sessions')
      }

      let timeNow = formatTime(new Date())
      for (let i = 0; i < numFiles; i++) {
        let fileName = timeNow + '-' + (await msgQueue.waitForLine()).slice(0, -2)
        console.log('File name: ', fileName)

        // let fileSize = Number(await msgQueue.waitForLine())
        // console.log('File size: ', fileSize)

        let fileData = (await msgQueue.waitForLine()).slice(0, -2)

        let file = fs.openSync(`sessions/${fileName}.txt`, 'w')
        fs.writeSync(
          file,
          fileData,
        )
        fs.closeSync(file)

        console.log(`File ${fileName} written`)
      }

      window.location.href = 'sessions.html'
    }

    document.getElementById('ports').innerHTML = tableify(validPorts) // DEBUG
  })
}

// Set a timeout that will check for new serial ports every 2 seconds.
setTimeout(function listPorts() {
  if (!portIsOpen) {
    listSerialPorts()
    setTimeout(listPorts, 2000)
  }
}, 2000)