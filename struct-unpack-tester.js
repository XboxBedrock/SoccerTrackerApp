const struct = require("python-struct");
const AHRS = require("ahrs")

const refreshRate = 20

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
    return qmult(qmult(q, { w: 0, x: vec.x, y: vec.y, z: vec.z }), qconj(q))
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
        [ax_local, ay_local, az_local] = readings.slice(3, 6)
        let q = madgwick.getQuaternion()
        let acceleration = addVectors(
            rotateVector({ x: ax_local, y: 0, z: 0 }, q),
            rotateVector({ x: 0, y: ay_local, z: 0 }, q),
            rotateVector({ x: 0, y: 0, z: az_local }, q)
        )
        velocity.x += acceleration.x / refreshRate
        velocity.y += acceleration.y / refreshRate
        velocity.z += acceleration.z / refreshRate
        locations[i+1] = {
            x: locations[i].x + velocity.x / refreshRate,
            y: locations[i].y + velocity.y / refreshRate,
            z: locations[i].z + velocity.z / refreshRate
        }
    }
}
