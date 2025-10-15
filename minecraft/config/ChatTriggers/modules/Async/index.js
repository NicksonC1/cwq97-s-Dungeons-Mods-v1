const Multithreading = Java.type("gg.essential.api.utils.Multithreading")

export default class Async {
    static run(runnable) {
        return new PromiseInstance(runnable)
    }
    static schedule(runnable, time) {
        return new PromiseInstance(runnable, time)
    }
}

class PromiseInstance {
    constructor(runnable, time) {
        finished = false
	  if (time) {
            Multithreading.schedule(() => {
                runnable()
                finished = true
            }, time, java.util.concurrent.TimeUnit.MILLISECONDS)
        } else {
            Multithreading.runAsync(() => {
                runnable()
                finished = true
            })
        }
    }

    isFinished() { return finished }
}