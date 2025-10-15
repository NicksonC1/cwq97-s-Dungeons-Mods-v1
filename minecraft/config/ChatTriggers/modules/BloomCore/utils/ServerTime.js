
const S32PacketConfirmTransaction = Java.type("net.minecraft.network.play.server.S32PacketConfirmTransaction")

// Active timers here as {ticksLeft: TICKS, onComplete: Function}
const waitFuncs = []
const registeredServerEvents = []


const tickWaitFuncs = () => {
    // Decrement each tick counter in the array
    for (let i = 0; i < waitFuncs.length; i++) {
        let thing = waitFuncs[i]
        thing.ticksLeft--

        // Timer not finished
        if (thing.ticksLeft > 0) {
            continue
        }
        
        // This timer has finished
        thing.onComplete()
        waitFuncs.splice(i, 1)
    }

    // Unregister this listener if there's nothing left
    return waitFuncs.length > 0
}

const triggerServerTickEvents = () => {
    for (let i = 0; i < registeredServerEvents.length; i++) {
        registeredServerEvents[i].tickFunc()
    }
}

register("packetReceived", (packet) => {
    const actionNumber = packet.func_148890_d()
    const windowId = packet.func_148889_c()

    if (actionNumber >= 0 || windowId !== 0) {
        return
    }

    tickWaitFuncs()
    triggerServerTickEvents()
}).setFilteredClass(S32PacketConfirmTransaction)

/**
 * Runs a function after a certain amount of server ticks has passed
 * @param {Number} ticks 
 * @param {Function} onComplete 
 */
export const waitServerTicks = (ticks, onComplete) => {
    waitFuncs.push({
        ticksLeft: ticks,
        onComplete
    })
}

/**
 * Runs a function after a certain amount of server ticks has passed
 * @param {Number} ticks 
 * @param {Function} onComplete 
 */
export const waitServerTime = (ms, onComplete) => waitServerTicks(Math.floor(ms / 50), onComplete)

class ServerTickEvent {
    constructor(func) {
        this.tickFunc = func
        this.registered = true

        registeredServerEvents.push(this)
    }

    run() {
        this.tickFunc()
    }

    register() {
        if (this.registered) {
            return this
        }

        registeredServerEvents.push(this)
        this.registered = true

        return this
    }

    unregister() {
        this.registered = false

        const ind = registeredServerEvents.indexOf(this)

        if (ind == -1) {
            return this
        }

        registeredServerEvents.splice(ind, 1)
        return this
    }
}

export const onServerTick = (func) => new ServerTickEvent(func)