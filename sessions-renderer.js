const fs = require('fs');
files = fs.readdirSync('./sessions');
for (const i of files) {
    document.getElementById("sessions").innerHTML += `<div class="buttondiv"><button type="button" class="sessionbutton" onclick="goToSession('${i.slice(0, -4)}')">${i.slice(0, -4)}</button><button type="button" class="delbutton" onclick="delSession('${i.slice(0, -4)}')">Delete</button></div>`
}

function goToSession(session) {
    console.log(`go to ${session}`);
    window.location.href = `./session-template.html?session=${session}`;
}

function delSession(session) {
    console.log(`del ${session}`);
    // window.location.href = './sessions/session-template.html';
}