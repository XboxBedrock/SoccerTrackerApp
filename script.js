var port;
function sendByte(b){
  if (port && port.writable) {
    const writer = port.writable.getWriter();
    writer.write(b);
    writer.releaseLock();  }}

if (document.getElementById ('askdata')) {
document.getElementById ('askdata').addEventListener("click", function() {
  sendByte(new Uint8Array([98])); // ascii 'b'
});}


const test = async function () {
  port = await navigator.serial.requestPort({});
  await port.open({ baudRate: 115200 });
}