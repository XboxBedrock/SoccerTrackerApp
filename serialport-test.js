// const Serialport = require('serialport/packages/serialport')
// const MockBinding = require('serialport/packages/binding-mock')
// const tableify = require('tableify')
// const { spawn } = require('child_process')
// const fs = require('fs')

// const MANUFACTURER_ID = '2E8A'
// let portIsOpen = false

// class NTimeParser {
//   constructor(port, parser, callback, maxUses) {
//     this.parser = port.pipe(parser)
//     this.numUses = 0
//     parser.on('data', data => {
//       callback(data)
//       if (++this.numUses === maxUses) {
//         this.parser.removeAllListeners()
//       }
//     })
//   }
// }

// class OneTimeParser {
//   constructor(port, parser, callback) {
//     NTimeParser(port, parser, callback, 1)
//   }
// }

// function sleep(ms) {
//   return new Promise(resolve => setTimeout(resolve, ms));
// }

// function waitForBytes(port, numBytes, sleepTime, timeout = 0) {
//   let data
//   let timeElapsed = 0
//   while (true) {
//     if ((data = port.read(numBytes)) !== null) {
//       return data
//     } else {
//       sleep(sleepTime)
//       timeElapsed += sleepTime
//       if ((timeout !== 0) && (timeElapsed >= timeout)) {
//         return null
//       }
//     }
//   }
// }

// function waitForLine(port, sleepTime, timeout = 0) {
//   let dataSoFar
//   let newData
//   let timeElapsed = 0
//   while (true) {
//     if ((newData = port.read(1)) !== null) {
//       dataSoFar += newData
//       if (dataSoFar[dataSoFar.length - 1] === '\n') {
//         return { data: dataSoFar, timedOut: false }
//       }
//     } else {
//       sleep(sleepTime)
//       timeElapsed += sleepTime
//       if ((timeout !== 0) && (timeElapsed >= timeout)) {
//         return { data: dataSoFar, timedOut: true }
//       }
//     }
//   }
// }

// function writeToPort(pathToPort, data) {
//   if (data[data.length - 1] !== '\n') {
//     throw new Error('writeToPort: data must end with a newline')
//   }
//   spawn('python3', ['send-to-serial.py', pathToPort, data])
// }

// async function listSerialPorts() {
//   portIsOpen = true
//   MockBinding.createPort('/dev/ROBOT', { echo: true, record: true })
//   const port = new Serialport('/dev/ROBOT', {autoOpen: true})
//   console.log('port created')
//   port.on('open', () => {
//     port.binding.emitData('Hello, world!\n')
//   })
//   console.log(waitForLine(port, 10))
// }

// // Set a timeout that will check for new serial ports every 2 seconds.
// // This timeout reschedules itself.
// setTimeout(function listPorts() {
//   if (!portIsOpen) {
//     listSerialPorts()
//     setTimeout(listPorts, 2000)
//   }
// }, 2000)


// // function portConnect(data) {
// //   port.removeAllListeners('data')
// //   console.log(data)
// //   console.assert(data.toString('utf8') === 'done')
// //   document.getElementById('error').innerHTML = 'Port has connected and flashed' // debug
// //   port.on('data', dataHandler)
// //   port.write('sendfiles\n')
// // }

// // function dataHandler(data) {
// //   port.removeAllListeners('data')
// //   if (data === 'done'); // done receiving files, move on (to what?)
// //   else {
// //     const sensorData = ''
// //     for (let i = 0; i < sensorData.length; i += 4) {
// //       console.log(data.toString('utf8') + '.txt')
// //       fs.writeFile(
// //         data.toString('utf8') + '.txt',
// //         sensorData.slice(i, i + 4) + ' ',
// //         (err) => {
// //           if (err) throw err
// //         }
// //       )
// //     }
// //   } // receive sensor data
// //   port.on('data', dataHandler)
// // }
// //
// // function sensorDataHandler(fileName) {
// //     port.removeAllListeners("data");
// //     return data => {
// //         port.removeAllListeners("data");
// //         for (let i = 0; i < data.length; i += 4) {
// //             console.log(fileName.toString("utf8"))
// //             fs.writeFile(fileName.toString("utf8")+".txt", data.slice(i, i+4)+' ', err => {
// //                 if (err) throw err;
// //             });
// //         }
// //     }
// // }


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


const fs = require('fs')
const Serialport = require('serialport/packages/serialport')
const tableify = require('tableify')
const ByteLength = require('serialport/packages/parser-byte-length')
const byteQueue = require('./byte-queue')
const { sleep } = require('./sleep')
const noiseFilter = require('./noise-filter')

const manufacturerId = '2E8A'
let portIsOpen = false

let msgQueue = new byteQueue.ByteQueue()
// let bytesAvailable = 0

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
    ports.forEach((device) => {
      if (device.vendorId !== undefined && device.vendorId.toUpperCase() === manufacturerId) validPorts.push(device)
    })

    if (validPorts.length === 0) { //
      document.getElementById('error').textContent = 'No devices discovered.'
    } else if (validPorts.length !== 1) {
      document.getElementById('error').textContent =
        'More than one compatible device found.'
    } else {
      portIsOpen = true
      let port = new Serialport(validPorts[0].path, {
        baudRate: 115200,
        autoOpen: true
      })
      // port.on('data', data => {
      //   msgQueue.push(...data.toString('utf8').split(''))
      //   console.log(msgQueue)
      //   // bytesAvailable += data.length
      // })

      port.pipe(new ByteLength({length: 1})).on('data', data => {
        msgQueue.push(data.toString('utf8'))
        console.log(msgQueue.queue.join(''))
        // console.log(msgQueue)
        // bytesAvailable += data.length
      })

      port.on('open', () => {
        console.log('Port opened')
      })
      port.write('flash\n')
      // await sleep(4000)
      console.log('Message: ', await msgQueue.waitForBytes(4))

      document.getElementById('error').innerHTML = 'Port has connected and flashed' // debug
      port.write('sendfiles\n')

      // numFiles = await msgQueue.waitForLine()  // number of files
      numFiles = Number(await msgQueue.waitForLine())  // number of files
      console.log('Number of files: ', numFiles)
      if (!fs.existsSync('sessions')) {
        fs.mkdirSync('sessions')
      }
      await sleep(1000)
      for (let i = 0; i < numFiles; i++) {
        let fileName = (await msgQueue.waitForLine()).slice(0, -1)
        console.log('File name: ', fileName)
        await sleep(1000)
        let fileSize = Number(await msgQueue.waitForLine())
        console.log('File size: ', fileSize)
        let filePath = `sessions/${fileName}.bin`
        if (fs.existsSync(filePath)) {
          console.log(`File ${fileName} already exists`)
          await msgQueue.waitForBytes(fileSize)
        } else {
          let file = fs.openSync(filePath, 'w')
          fs.writeSync(
            file,
            await msgQueue.waitForBytes(fileSize),
          )
          console.log(`File ${fileName} written`)
        }
      }

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