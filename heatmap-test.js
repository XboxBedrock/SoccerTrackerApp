const AHRS = require("ahrs")
const struct = require("python-struct")
const {sleep} = require("./sleep")
const urlParams = new URLSearchParams(window.location.search);
const trueSession = urlParams.get('session')
const session = `./sessions/${trueSession}.txt`
const h337 = require('./heatmap')
console.log(session)
console.log(document.getElementById('heatmap-canvas').getContext('2d'))
document.getElementById("title").innerHTML +=  " " + trueSession

let heatmapInstance = h337.create({
    container: document.querySelector('.heatmap')
})

let points = []
let max = 0
let width = 840
let height = 400
let numPoints = 200

while (numPoints--) {
    let val = Math.floor(Math.random() * 100)
    max = Math.max(max, val)
    points.push({
        x: Math.floor(Math.random() * width),
        y: Math.floor(Math.random() * height),
        value: val
    })
    console.log(points[points.length - 1])
}

heatmapInstance.setData({
    max: max,
    min: 0,
    data: points
})