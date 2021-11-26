const Serialport = require('serialport/packages/serialport')
const ByteLength = require('serialport/packages/parser-byte-length')
const Readline = require('serialport/packages/parser-readline')
const tableify = require('tableify')
const { spawn } = require('child_process')
const fs = require('fs')

const MANUFACTURER_ID = '2E8A'
let portIsOpen = false
let port

class NTimeParser {
  constructor(port, parser, callback, maxUses) {
    this.parser = port.pipe(parser)
    this.numUses = 0
    parser.on('data', data => {
      callback(data)
      if (++this.numUses === maxUses) {
        this.parser.removeAllListeners()
      }
    })
  }
}

class OneTimeParser {
  constructor(port, parser, callback) {
    NTimeParser(port, parser, callback, 1)
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForBytes(port, numBytes, sleepTime, timeout = 0) {
  let data
  let timeElapsed = 0
  while (true) {
    if ((data = port.read(numBytes)) !== null) {
      return data
    } else {
      await sleep(sleepTime)
      timeElapsed += sleepTime
      if ((timeout !== 0) && (timeElapsed >= timeout)) {
        return null
      }
    }
  }
}

async function waitForLine(port, sleepTime, timeout = 0) {
  let dataSoFar
  let newData
  let timeElapsed = 0
  while (true) {
    if ((newData = port.read(1)) !== null) {
      dataSoFar += newData
      if (dataSoFar[dataSoFar.length - 1] === '\n') {
        return { data: dataSoFar, timedOut: false }
      }
    } else {
      await sleep(sleepTime)
      timeElapsed += sleepTime
      if ((timeout !== 0) && (timeElapsed >= timeout)) {
        return { data: dataSoFar, timedOut: true }
      }
    }
  }
}

function writeToPort(pathToPort, data) {
  if (data[data.length - 1] !== '\n') {
    throw new Error('writeToPort: data must end with a newline')
  }
  spawn('python3', ['send-to-serial.py', pathToPort, data])
}

async function listSerialPorts() {
  await Serialport.list().then(async (ports, err) => {
    if (err) {
      document.getElementById('error').textContent = err.message
      return
    } else {
      document.getElementById('error').textContent = ''
    }

    console.log('Ports:', ports) // DEBUG

    const validPorts = [] // list of soccer tracker ports
    ports.forEach(device => {
      if (device.vendorId !== undefined && device.vendorId.toUpperCase() === MANUFACTURER_ID) {
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
      port = new Serialport(validPorts[0].path, {
        baudRate: 9600,
        autoOpen: true,
      }, err => {
        console.log('Error opening port:', err)
      })
      // port.setEncoding('utf-8')
      console.log('port:', validPorts[0]) // DEBUG
      console.log(port) // DEBUG
      await sleep(2000)
      console.log(port.isOpen) // DEBUG
      port.on('open', () => { // DEBUG
        console.log('open')
        if (err) {
          document.getElementById('error').textContent = err.message
          return
        }
      })

      // spawn('python3', ['send-to-serial.py', 'flash\n'])
      writeToPort(port.path, 'flash\n')
      // port.write('flash\n', 'utf-8', err => {console.log(err)})
      console.log('flash sent') // DEBUG
      console.log(waitForBytes(port, 4, 10))

      // const parser = port.pipe(new ByteLength({length: 4}))
      // parser.on('data', data => {
      //   console.log(data.toString('utf8'))
      //   parser.removeEventListener('data', this)
      // })
      // OneTimeParser(port, new ByteLength({ length: 4 }), data => {
      //   console.log(data.toString('utf8'))
      // })

      document.getElementById('error').innerHTML = 'Port has connected and flashed' // debug
      // port.write('sendfiles\n')

      // numFiles = Number(waitForLine(port, 10).data)  // number of files
      // for (let i = 0; i < numFiles; i++) {
      //   let fileName = waitForLine(port, 10).data.toString.slice(0, -1)
      //   let fileSize = Number(waitForLine(port, 10).data)
      //   fs.writeFileSync(
      //     'sessions/' + fileName + '.txt',
      //     waitForBytes(port, fileSize, 10)
      //   )
      // }






      // // might have to change delimiter to '\r\n'
      // NTimeParser(port, new Readline(), data => {
      //   fs.writeFileSync(
      //     'sessions/' + fname + '.txt',
      //     msg.toString('utf8'),
      //     err => { if (err) throw err }
      //   )
      // }, 2)

      // let readingFiles = true
      // while (readingFiles) {
      //   console.log(fname)
      //   let fname = messageQueue.waitForMessage().toString('utf8')
      //   if (fname.toString('utf8') !== 'done') {
      //     msg = messageQueue.waitForMessage().toString('utf8')
      //     console.log(msg)
      //     fs.writeFile(
      //       'sessions/'+fname+'.txt',
      //       msg.toString('utf8'),
      //       err => {if (err) throw err}
      //     )
      //   } else readingFiles = false
      // }

      // while (readingFiles) {
      //   await messageQueue.getMessage().then(async fname => {
      //     console.log(fname.toString('utf8'))
      //     if (fname !== 'done') { // the data that was sent is the filename
      //       await messageQueue.getMessage().then(sensorData => {
      //         // for (let i = 0; i < sensorData.length; i += 4) {
      //         //   console.log(data.toString('utf8') + '.txt')  // debug
      //         //   fs.writeFile(
      //         //     data.toString('utf8') + '.txt',
      //         //     sensorData.slice(i, i + 4) + ' ',
      //         //     err => {if (err) throw err}
      //         //   )
      //         // }
      //         fs.writeFile(
      //           'sessions/'+fname.toString('utf8')+'.txt',
      //           sensorData.toString('utf8'),
      //           err => {if (err) throw err}
      //         )
      //       })
      //     } else readingFiles = false
      //   })
      // }
      // https://github.com/lyngklip/structjs

      // var enc = new TextEncoder();
      // data = ""
      // new struct().unpack(enc.encode(data).buffer) does nothing anyways cause empty str

      // let data = "";
      // const numLines = parseInt(new Readline());
      // const stripEnd = parseInt(new Readline())
      // for (let i = 0; i < numLines; i++) {
      //     data += new Readline();
      // }
      // if (stripEnd) data = data.slice(0, -1);
      // console.log(data);
    }

    document.getElementById('ports').innerHTML = tableify(validPorts) // DEBUG
  })
}

// Set a timeout that will check for new serial ports every 2 seconds.
// This timeout reschedules itself.
setTimeout(function listPorts() {
  if (!portIsOpen) {
    listSerialPorts()
    setTimeout(listPorts, 2000)
  }
}, 2000)


// function portConnect(data) {
//   port.removeAllListeners('data')
//   console.log(data)
//   console.assert(data.toString('utf8') === 'done')
//   document.getElementById('error').innerHTML = 'Port has connected and flashed' // debug
//   port.on('data', dataHandler)
//   port.write('sendfiles\n')
// }

// function dataHandler(data) {
//   port.removeAllListeners('data')
//   if (data === 'done'); // done receiving files, move on (to what?)
//   else {
//     const sensorData = ''
//     for (let i = 0; i < sensorData.length; i += 4) {
//       console.log(data.toString('utf8') + '.txt')
//       fs.writeFile(
//         data.toString('utf8') + '.txt',
//         sensorData.slice(i, i + 4) + ' ',
//         (err) => {
//           if (err) throw err
//         }
//       )
//     }
//   } // receive sensor data
//   port.on('data', dataHandler)
// }
//
// function sensorDataHandler(fileName) {
//     port.removeAllListeners("data");
//     return data => {
//         port.removeAllListeners("data");
//         for (let i = 0; i < data.length; i += 4) {
//             console.log(fileName.toString("utf8"))
//             fs.writeFile(fileName.toString("utf8")+".txt", data.slice(i, i+4)+' ', err => {
//                 if (err) throw err;
//             });
//         }
//     }
// }
