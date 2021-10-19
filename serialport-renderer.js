const Serialport = require("serialport/packages/serialport");
const tableify = require("tableify");
const fs = require("fs");
// const Readline = serialport.parsers.Readline;

const manufacturerId = "2E8A";
let portIsOpen = false;
let port;

let port_messages = [];

async function listSerialPorts() {
  await Serialport.list().then(async (ports, err) => {
    if (err) {
      document.getElementById("error").textContent = err.message;
      return;
    } else {
      document.getElementById("error").textContent = "";
    }

    console.log("Ports:", ports); // DEBUG

    const validPorts = []; // list of soccer tracker ports
    ports.forEach((device) => {
      if (device.vendorId === manufacturerId) validPorts.push(device);
    });

    if (validPorts.length === 0) {
      document.getElementById("error").textContent = "No devices discovered.";
    } else if (validPorts.length !== 1) {
      document.getElementById("error").textContent =
        "More than one compatible device found.";
    } else {
      port = new Serialport(validPorts[0].path, {
        baudRate: 9600,
        autoOpen: true,
      });
      port.write("flash\n");
      port.on("data", portConnect).then(port.on);
      // console.log(eventListener)

      // let data = "";
      // const numLines = parseInt(new Readline());
      // const stripEnd = parseInt(new Readline())
      // for (let i = 0; i < numLines; i++) {
      //     data += new Readline();
      // }
      // if (stripEnd) data = data.slice(0, -1);
      // console.log(data);
      portIsOpen = true;
    }

    document.getElementById("ports").innerHTML = tableify(validPorts); // DEBUG
  });
}

// Set a timeout that will check for new serial ports every 2 seconds.
// This timeout reschedules itself.
setTimeout(function listPorts() {
  if (!portIsOpen) {
    listSerialPorts();
    setTimeout(listPorts, 2000);
  }
}, 2000);

function portConnect(data) {
  port.removeAllListeners("data");
  console.log(data);
  console.assert(data.toString("utf8") === "done");
  document.getElementById("error").innerHTML = "Port has connected and flashed"; // debug
  port.on("data", dataHandler);
  port.write("sendfiles\n");
}

function dataHandler(data) {
  port.removeAllListeners("data");
  if (data === "done");
  else {
    // done receiving files, move on (to what?)
    const sensorData = "";
    for (let i = 0; i < sensorData.length; i += 4) {
      console.log(data.toString("utf8") + ".txt");
      fs.writeFile(
        data.toString("utf8") + ".txt",
        sensorData.slice(i, i + 4) + " ",
        (err) => {
          if (err) throw err;
        }
      );
    }
  } // receive sensor data
  port.on("data", dataHandler);
}

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
