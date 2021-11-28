const simpleheat = require('./simpleheat')
const AHRS = require("ahrs")
const struct = require('python-struct')
const fs = require('fs');
const urlParams = new URLSearchParams(window.location.search);
const session = urlParams.get('session')
const sessionTime = `./sessions/${session}.txt`

const refreshRate = 20
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

console.log(sessionTime)
// console.log(document.getElementById('heatmap-canvas').getContext('2d'))  // debug
document.getElementById("title").innerHTML +=  " " + session
document.getElementById("titleshow").innerHTML +=  " " + session

let heat = simpleheat(document.getElementById('heatmap-canvas'));

// let points = []
// let max = 0
// let width = 840
// let height = 400
// let numPoints = 200

// while (numPoints--) {
//     let val = Math.floor(Math.random() * 100)
//     max = Math.max(max, val)
//     points.push([
//         Math.floor(Math.random() * width),
//         Math.floor(Math.random() * height),
//         val
//     ])
//     // console.log(points[points.length - 1])  // debug
// }

function qmult(q1, q2) {
    return {
        w: q1.w * q2.w - q1.x * q2.x - q1.y * q2.y - q1.z * q2.z,
        x: q1.w * q2.x + q1.x * q2.w + q1.y * q2.z - q1.z * q2.y,
        y: q1.w * q2.y - q1.x * q2.z + q1.y * q2.w + q1.z * q2.x,
        z: q1.w * q2.z + q1.x * q2.y - q1.y * q2.x + q1.z * q2.w
    }
}

function qconj(q) {
    return {
        w: q.w,
        x: -q.x,
        y: -q.y,
        z: -q.z
    }
}

function rotateVector(vec, q) {
    let res = qmult(qmult(q, { w: 0, x: vec.x, y: vec.y, z: vec.z }), qconj(q))
    return {x: res.x, y: res.y, z: res.z}
}

function addVectors(...vecs) {
    let res = { x: 0, y: 0, z: 0 }
    for (let i = 0; i < vecs.length; i++) {
        res.x += vecs[i].x
        res.y += vecs[i].y
        res.z += vecs[i].z
    }
    return res
}

function getLocations(readings) {
    let locations = new Array(readings.length+1)
    locations[0] = { x: 0, y: 0, z: 0 }

    const madgwick = new AHRS({
        sampleInterval: refreshRate,
        algorithm: "Madgwick",
        beta: 0.4,
        doInitialisation: true
    })

    let velocity = { x: 0, y: 0, z: 0 }
    for (let i = 0; i < readings.length; ++i) {
        madgwick.update(...readings[i])
        let ax_local, ay_local, az_local
        [ax_local, ay_local, az_local] = readings[i].slice(3, 6)
        let q = madgwick.getQuaternion()
        // console.log(q)
        let acceleration = addVectors(
            rotateVector({ x: ax_local, y: 0, z: 0 }, q),
            rotateVector({ x: 0, y: ay_local, z: 0 }, q),
            rotateVector({ x: 0, y: 0, z: az_local }, q)
        )
        console.log(ax_local, ay_local, az_local)
        velocity.x += acceleration.x / refreshRate
        velocity.y += acceleration.y / refreshRate
        velocity.z += acceleration.z / refreshRate
        locations[i+1] = {
            x: locations[i].x + velocity.x / refreshRate,
            y: locations[i].y + velocity.y / refreshRate,
            z: locations[i].z + velocity.z / refreshRate
        }
    }
    for (let i = 0; i < locations.length; ++i) {
        locations[i] = [locations[i].x*1000, locations[i].y*1000, 1]
    }
    return locations
}

function fromBase64(n) {
    n = n.split('').reverse().join('')
    res = 0
    for (let i = 0; i < n.length; ++i) res += alphabet.indexOf(n[i])*Math.pow(64, i)
    return res
}

function toBase256(n) {
    let res = []
    while (n > 0) {
        res.push(n % 256)
        n = Math.floor(n / 256)
    }
    res = res.reverse()
    while (res.length < 9) res.unshift(0)
    return res
}

const sessionFile = fs.openSync(sessionTime, 'r')
const data = fs.readFileSync(sessionFile).toString()
readings = []
for (let i = 0; i < data.length; i += 48) {
    c = ''
    // console.log(data.substring(i, i+48), fromBase64(data.substring(i, i+48)), toBase256(fromBase64(data.substring(i, i+48))))
    for (const n of toBase256(fromBase64(data.substring(i, i+48)))) {
        c += String.fromCharCode(n)
        // console.log(c.length, c)
    }
    readings.push(struct.unpack('<fffffffff', Buffer.from(c)))
}

points = getLocations(readings)

console.log(points)

// heat.max(max)
heat.data(points)
heat.draw()