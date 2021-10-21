const Serialport = require('serialport/packages/serialport')
const ByteLength = require('serialport/packages/parser-byte-length')
const tableify = require('tableify')
const fs = require('fs')
const byteQueue = require('./byte-queue')
const noiseFilter = require('./noise-filter')
const struct = require("./struct")

const manufacturerId = '2E8A'
let portIsOpen = false
let port

let msgQueue = new byteQueue.ByteQueue()
let bytesAvailable = 0

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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
    ports.forEach((device) => {
      if (device.vendorId === manufacturerId) validPorts.push(device)
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
        autoOpen: true
      })
      // let messageQueue = new serialportQueue.SerialPortQueue(port);
      port.pipe(new ByteLength({length: 1})).on('data', data => {
        msgQueue.push(data.toString('utf8'))
        bytesAvailable += data.length
      })
      port.write('flash\n')
      await sleep(1000)
      console.log(msgQueue.getBytes(4))

      document.getElementById('error').innerHTML = 'Port has connected and flashed' // debug
      port.write('sendfiles\n')

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
