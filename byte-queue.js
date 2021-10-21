// module.exports.SerialPortQueue = class SerialPortQueue {
//     constructor(serialport){
//         this.resolves = []
//         this.unreadMessages = []
//         serialport.on('data', data => {
//             this.unreadMessages.push(data)
//             try {this.resolves.shift()(this.unreadMessages.shift())}
//             catch (err) {if (err.name !== 'TypeError') throw err}
//             console.log(data.toString('utf8'))
//         })
//     }

//     getMessage() {
//         const newPromise = new Promise((resolve, reject) => {
//             if (this.unreadMessages.length !== 0) resolve(this.unreadMessages.shift())
//             else this.resolves.push(resolve)
//         })
//         return newPromise
//     }
// }


// module.exports.SerialPortQueue = class SerialPortQueue {
//     constructor(serialport){
//         this.queue = [];
//         // this.serialport = serialport
//         serialport.on('data', data => {
//             this.queue.push(data)
//         })
//     }

//     getMessage() {
//         return this.queue.shift()
//     }

//     messagesAvailable() {
//         return this.queue.length !== 0
//     }

//     peek() {
//         if (this.messagesAvailable()) return this.queue[0]
//         throw RangeError('Cannot peek empty queue')
//     }

//     waitForMessage() {
//         while (!this.messagesAvailable());
//         return this.getMessage()
//     }
// }

module.exports.ByteQueue = class ByteQueue {
    constructor(){
        this.queue = []
    }

    async push(c) {
        for (let i = 0; i < c.length; ++i)
            this.queue.push(c[i])
    }

    getBytes(n) {
        let res = ''
        if (n > this.queue.length) throw RangeError(`${n} bytes not available`)
        for (let i = 0; i < n; ++i) res += this.queue.shift()
        return res
    }

    async waitForBytes(n) {
        let res = ''
        while (n > this.queue.length);
        for (let i = 0; i < n; ++i) res += this.queue.shift()
        return res
    }
}
