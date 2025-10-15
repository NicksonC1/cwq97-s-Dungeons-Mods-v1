const pathSymbol = Symbol("path")

class PogObject {
    constructor(module, defaultObject = {}, fileName) {
        this[pathSymbol] = [module, fileName]
        let data = FileLib.read(module, fileName)
        try {
            data = data ? JSON.parse(data) : {}
        } catch (e) {
            console.error(e)
            console.log(`[PogData] Reset ${module} to default data`)
            data = {}
        }
        Object.assign(this, defaultObject, data)
    }

    save() {
        FileLib.write(
            this[pathSymbol][0],
            this[pathSymbol][1],
            JSON.stringify(this, null, 4),
            true
        )
    }
} 

const config = new PogObject("SimonSays", {
    blockWrongClicks: true,
    blockDuringLag: true,
    sounds: true,
    messages: true,
    P3StartCountdown: true,
    P3StartGUI: {
        x: Renderer.screen.getWidth() / 2,
        y: Renderer.screen.getHeight() / 2 - 100,
        scale: 3
    },
}, "datafile.json")

export default config