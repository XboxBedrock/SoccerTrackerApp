const fs = require('fs');

files = fs.readdirSync('./sessions').sort((a, b) => {
    a_lst = a.slice(0, -4).split('-')
    b_lst = b.slice(0, -4).split('-')
    if (a_lst[2] == b_lst[2]) {
        a_lst = a_lst.slice(0, 2) + a_lst.slice(3, -1)
        b_lst = b_lst.slice(0, 2) + b_lst.slice(3, -1)
        return (a_lst > b_lst) - (a_lst < b_lst)
    }
    return (a_lst[2] > b_lst[2]) - (a_lst[2] < b_lst[2])
});

for (const i of files)
    document.getElementById("sessions").innerHTML += `<div class="buttondiv"><button type="button" class="sessionbutton" onclick="goToSession('${i.slice(0, -4)}')">${i.slice(0, -4)}</button><button type="button" class="delbutton" onclick="delSession('${i.slice(0, -4)}')">Delete</button></div>`

function goToSession(session) {
    // console.log(`go to ${session}`);  // debug
    window.location.href = `./session-template.html?session=${session}`
}

function delSession(session) {
    // console.log(`del ${session}`);  // debug
    fs.unlinkSync(`./sessions/${session}.txt`)
    window.location.reload();
}