const serialport = require("serialport/packages/serialport");
const tableify = require("tableify");
const Readline = serialport.parsers.Readline;

const manufacturerId = "2E8A";
let portIsOpen = false;
let port;

async function listSerialPorts() {
    await serialport.list().then(async (ports, err) => {
        if (err) {
            document.getElementById("error").textContent = err.message;
            return;
        } else {
            document.getElementById("error").textContent = "";
        }

        console.log("Ports:", ports); // DEBUG

        let validPorts = []; // list of soccer tracker ports
        ports.forEach((device) => {
            if (device.vendorId === manufacturerId) validPorts.push(device);
        });

        if (validPorts.length === 0) {
            document.getElementById("error").textContent = "No devices discovered.";
        } else if (validPorts.length !== 1) {
            document.getElementById("error").textContent =
                "More than one compatible device found.";
        } else {
            port = await new serialport(validPorts[0].path, {
                baudRate: 9600,
                autoOpen: true,
            });
            await setTimeout(() => {
                port.write("b");
                console.log("eeeee");
                port.on("data", redirPage);
                portIsOpen = true;
            }, 500);
        }

        tableHTML = tableify(validPorts); // DEBUG
        document.getElementById("ports").innerHTML = tableHTML;
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

function redirPage(event) {
    console.log(event);
    event.preventDefault();
}
