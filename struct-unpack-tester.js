const struct = require("python-struct");
const AHRS = require("ahrs")

const buf = Buffer.from('abcd');
console.log(struct.unpack('>'+'f'.repeat(buf.length/4), buf))

class Vector {
    constructor(x, y, z) {
        if (x instanceof Vector || typeof x === 'object') {
            this.x = x.x
            this.y = x.y
            this.z = x.z
        } else {
            this.x = x
            this.y = y
            this.z = z
        }
    }

    add(v) {
        return new Vector(this.x + v.x, this.y + v.y, this.z + v.z)
    }

    subtract(v) {
        return new Vector(this.x - v.x, this.y - v.y, this.z - v.z)
    }

    multiply(n) {
        return new Vector(this.x * n, this.y * n, this.z * n)
    }

    divide(n) {
        return new Vector(this.x / n, this.y / n, this.z / n)
    }

    fromQuaternion(q) {  // TODO: check if function is correct
        return new Vector(q.y, q.z, q.w)
    }
}

function get_angles(arr) {
    locations = new Array(arr.length)
    locations[0] = [0, 0, 0]
    const madgwick = new AHRS({
        sampleInterval: 20,
        algorithm: "Madgwick",
        beta: 0.4,
        doInitialisation: false
    })
    madgwick.init(arr[0])
    for (let i = 1; i < arr.length; ++i) {
        madgwick.update(...arr[i])
        // locations[i+1] = locations[i] + Vector(madgwick.toVector())*arr.slice(0, 3)
        console.log(madgwick.toVector())
    }
}

get_angles([[0, 1, 2, 3, 4, 5, 6, 7, 8]])