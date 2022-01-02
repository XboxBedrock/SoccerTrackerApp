const simpleheat = require('simpleheat')
const AHRS = require("ahrs")
const struct = require('python-struct')
const fs = require('fs');
const urlParams = new URLSearchParams(window.location.search);
const sessionTime = urlParams.get('session')
const sessionFilename = `./sessions/${sessionTime}.txt`

const sampleFreq = 20
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

console.log(sessionFilename)
// console.log(document.getElementById('heatmap-canvas').getContext('2d'))  // debug
document.getElementById("title").innerHTML +=  " " + sessionTime
document.getElementById("titleshow").innerHTML +=  " " + sessionTime

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
    let locations = new Array(readings.length)
    locations[0] = { x: 0, y: 0, z: 0 }

    const madgwick = new AHRS({
        sampleInterval: sampleFreq,
        algorithm: "Madgwick",
        beta: 0.4,
        doInitialisation: true
    })

    let velocity = { x: 0, y: 0, z: 0 }
    for (let i = 1; i < readings.length; ++i) {
        madgwick.update(...readings[i])

        let [ax_local, ay_local, az_local] = readings[i].slice(3, 6)

        // rotate the accelerometer vector from the body frame to the world frame
        let q = madgwick.getQuaternion()
        let acceleration = addVectors(
            rotateVector({ x: ax_local, y: 0, z: 0 }, q),
            rotateVector({ x: 0, y: ay_local, z: 0 }, q),
            rotateVector({ x: 0, y: 0, z: az_local }, q)
        )

        // update velocity
        velocity.x += acceleration.x / sampleFreq
        velocity.y += acceleration.y / sampleFreq
        velocity.z += acceleration.z / sampleFreq

        // update location
        locations[i] = {
            x: locations[i-1].x + velocity.x / sampleFreq + 0.5*acceleration.x*Math.pow(sampleFreq, -2),
            y: locations[i-1].y + velocity.y / sampleFreq + 0.5*acceleration.y*Math.pow(sampleFreq, -2),
            z: locations[i-1].z + velocity.z / sampleFreq + 0.5*acceleration.z*Math.pow(sampleFreq, -2)
        }
    }

    for (let i = 0; i < locations.length; ++i) {  // convert to simpleheat format
        locations[i] = [locations[i].x+450, locations[i].y+250, 1]
    }

    return locations
}

function fromBase64(n) {
    n = n.split('').reverse().join('')
    res = BigInt(0)
    for (let i = 0; i < n.length; ++i) res += BigInt(alphabet.indexOf(n[i])*Math.pow(64, i))
    return res
}

function toBase256(n) {
    let res = Buffer.alloc(36)
    let i = 0
    while (n > BigInt(0)) {
        res[i++] = Number(n % BigInt(256))
        n /= BigInt(256)
    }
    res = res.reverse()
    // while (res.length < 36) res.unshift(0)
    return res
}

const sessionFile = fs.openSync(sessionFilename, 'r')
const data = fs.readFileSync(sessionFile).toString()
let readings = []
for (let i = 0; i < data.length; i += 48) {
    // c = Buffer.from(data.slice(i, i+48), 'base64')
    // while (c.length < 36) c = Buffer(0) + c
    // console.log(c)

    let chunk = data.slice(i, i+48)

    console.log(  // DEBUG
        i/48+1,
        fromBase64(chunk),
        toBase256(fromBase64(chunk)),
        struct.unpack('<fffffffff', toBase256(fromBase64(chunk)))
    )

    readings.push(struct.unpack('<fffffffff', toBase256(fromBase64(chunk))))
}

points = getLocations(readings)

console.log(points)

// heat.max(max)
heat.data(points)
heat.radius(10, 20)
heat.draw()