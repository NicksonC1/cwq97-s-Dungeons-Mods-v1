import { MouseEvent, getObjectXYZ } from "./utils"
import RenderLib from "./utils"
import config from "./config"

const S32PacketConfirmTransaction = Java.type("net.minecraft.network.play.server.S32PacketConfirmTransaction");

const prefix = "&3[&bSimonSays&3]&r "

let debug = false

let ticks = 0
let allowClick = true
let lastExisted = false
const start = [111, 120, 92]
const BUTTONWIDTH = 0.4
const BUTTONHEIGHT = 0.26
let startTime = 0
let blockAllClicks = false
let ssCompletedTime = false
let p3juststartedlock = 0
let buttonsShown = 0
let skipOver = false
let allObi = true

let blocks = new Set()
let newRenderScanning = new Set()

const renderWorldSSHighlight = register("renderWorld", () => {
    const b = [...blocks]
    for (let i = 0; i < b.length; i++) {
        let [x, y, z] = b[i].split(",").map(a => parseInt(a))
        let color = [0, 1, 0]
        if (i == 1) color = [1, 1, 0]
        else if (i > 1) color = [1, 0, 0]

        RenderLib.drawInnerEspBox(x+0.05, y+0.5-BUTTONHEIGHT/2+0.001, z+0.5, BUTTONWIDTH, BUTTONHEIGHT, ...color, 0.7, false)
    }
}).unregister()

const serverTicksForSS = register("packetReceived", () => {
    ticks++
    allowClick = true
}).setFilteredClass(S32PacketConfirmTransaction).unregister()

const clientTicksForSS = register("tick", () => {
    let [x0, y0, z0] = start;
    let buttonsExist = World.getBlockAt(x0 - 1, y0, z0).type.getID() == 77;
        
    if (buttonsExist && !lastExisted) {
        allObi = true

        for (let dy = 0; dy <= 3; dy++) {
            for (let dz = 0; dz <= 3; dz++) {
                let [x, y, z] = [x0, y0 + dy, z0 + dz];
                let block = World.getBlockAt(x, y, z);
            
                if (block.type.getID() !== 49) allObi = false
                // if (debug) ChatLib.chat(allObi)
            }
        }

        if (allObi) {
            lastExisted = true;
            skipOver = true
            // if (debug) ChatLib.chat("skipOver = true")
        }
    }

    if (!buttonsExist && lastExisted) {
        lastExisted = false;
        blocks.clear();
    }

    for (let dy = 0; dy <= 3; dy++) {
        for (let dz = 0; dz <= 3; dz++) {
            let [x, y, z] = [x0, y0 + dy, z0 + dz];
            let block = World.getBlockAt(x, y, z);
            let str = [x, y, z].join(",");
        
            if (block.type.getID() !== 169 || blocks.has(str)) continue;

            blocks.add(str)

            if (!skipOver) {
                buttonsShown++
                if (buttonsShown == 3) deleteFirstN(blocks, 1)
                else if (buttonsShown == 5 || buttonsShown == 6) deleteFirstN(blocks, 1)
                else if (buttonsShown == 8 || buttonsShown == 9) deleteFirstN(blocks, 1)
                else if (buttonsShown > 10) deleteFirstN(blocks, 1)
            }
        }
    }
}).unregister()


const p3ArmorStandScan = register("renderEntity", (e, pos, sum, event) => {
    const name = e.name.removeFormatting()
    if (name == "Inactive" || name == "Inactive Terminal" || name == "Not Activated" && p3juststartedlock == 0) {
        p3juststartedlock = 1
        p3juststarted()
    }
}).unregister()


function p3juststarted() {
    p3ArmorStandScan.unregister()
    p3Started = true
    revertRender = false
    timesClickedOnSkip = 0
    startTime = Date.now()
    ticks = 0
    queuedClear = 0
    allowClick = true
    awaitingClick = false
    timesClickedBeforeStopClicks = 0
    ssCompletedTime = false
    blockAllClicks = false
    lastExisted = false
    buttonsShown = 0
    skipOver = false
    newRenderScanning.clear()
    blocks.clear()
    playerInteract.register()
    clientTicksForSS.register()
    serverTicksForSS.register()
    mouseevent.register()
    renderWorldSSHighlight.register()
    serverScheduleTaskRegister.register()
    termLeverDeviceChat.register()
}

register("command", () => {
    revertRender = false
    timesClickedOnSkip = 0
    startTime = Date.now()
    ticks = 0
    queuedClear = 0
    allowClick = true
    awaitingClick = false
    timesClickedBeforeStopClicks = 0
    ssCompletedTime = false
    blockAllClicks = false
    lastExisted = false
    buttonsShown = 0
    skipOver = false
    newRenderScanning.clear()
    blocks.clear()
    playerInteract.register()
    clientTicksForSS.register()
    serverTicksForSS.register()
    mouseevent.register()
    renderWorldSSHighlight.register()
    serverScheduleTaskRegister.register()
    termLeverDeviceChat.register()
}).setName("startss")

register("command", () => {
    blocks.clear()
}).setName("clearss")

const mouseevent = register(MouseEvent, (event) => {
    if (!config.blockWrongClicks && !config.blockDuringLag && !blockAllClicks) return
    const button = event.button
    const state = event.buttonstate
    if (button !== 1 || !state) return
    const blocksArr = [...blocks]
    const la = Player.lookingAt()
    if (!la || !(la instanceof Block)) return
    const [x, y, z] = getObjectXYZ(la)
    const str = [x+1, y, z].join(",")
    if (World.getBlockAt(x, y, z).type.getID() !== 77) return
    if (str !== blocksArr[0] && config.blockWrongClicks && !Player.isSneaking() && World.getBlockAt(x+1, y, z).type.getID() == 49) {
        cancel(event)
        if (config.sounds) World.playSound("random.successful_hit", 10, 0.0)
        if (config.messages) ChatLib.chat(prefix + '&cBlocking click because the wrong button was clicked')
            return
    }
    if (config.blockDuringLag && World.getBlockAt(x+1, y, z).type.getID() !== 133) {
        if (allowClick) {
            allowClick = false
            return
        }
        cancel(event)
        if (config.sounds) World.playSound("random.successful_hit", 10, 0.0)
        if (config.messages) ChatLib.chat(prefix + '&cBlocking click because of server lag')
    }
}).unregister()

function simonSaysOverDetection(name) {
    if (name == Player.getName()) {
        if (Player.getX() > 103 && Player.getY() < 135 && Player.getY() > 106 && Player.getZ() < 103 && Player.getZ() > 84) ssJustFinished()
    }
    else {
        World.getAllPlayers().forEach(entity => {
            if (entity.getName() !== name) return
            if (entity.getPing() == 1 && !entity.isInvisible() && entity.getX() > 103 && entity.getY() < 135 && entity.getY() > 106 && entity.getZ() < 103 && entity.getZ() > 84) ssJustFinished()
        })
    }
}

function ssJustFinished() {
    ChatLib.chat(prefix + `&eSS Took &6${((ssCompletedTime - startTime)/1000).toFixed(3)}s!`)
}

function deleteFirstN(set, n) {
    let iter = set.values();
    for (let i = 0; i < n; i++) {
        let val = iter.next().value
        if (val === undefined) break
        set.delete(val)
    }
}

const playerInteract = register("playerInteract", (action, pos) => {
    if (action.toString() !== "RIGHT_CLICK_BLOCK") return
    let [x, y, z] = [pos.getX(), pos.getY(), pos.getZ()]
    if (x == 110 && y == 121 && z == 91) {
        blocks.clear()
        return
    }
    let isButton = World.getBlockAt(x, y, z).type.getID() == 77
    let str = [x+1, y, z].join(",")
    if (!isButton) return
    blocks.delete(str)
}).unregister()

const termLeverDeviceChat = register("chat", (name, action, object, completed, total) => {
    if (object == "device") {
        ssCompletedTime = Date.now()
        simonSaysOverDetection(name)
    }
    if (completed == 7) {
        // if (debug) ChatLib.chat(`${prefix}Detected 1st section end, unregistering ss registers.`)
        playerInteract.unregister()
        clientTicksForSS.unregister()
        serverTicksForSS.unregister()
        mouseevent.unregister()
        renderWorldSSHighlight.unregister()
        serverScheduleTaskRegister.unregister()
        termLeverDeviceChat.unregister()
    }
}).setCriteria(/(\w+) (activated|completed) a (terminal|device|lever)! \((\d)\/(\d)\)(?: \(([\d.]+)s \| ([\d.]+)s\))?/).unregister()

register("worldUnload", () => {
    p3Started = false
})

register("command", () => {
    config.blockWrongClicks = !config.blockWrongClicks
    config.save()

    const blockWrongClicksTxt = new TextComponent(`&3Block Wrong Clicks&f: ${config.blockWrongClicks? "&aEnabled": "&cDisabled"}`).setClick("run_command", "/blockwrongclicks").setHover("show_text", "/blockwrongclicks")
    const blockDuringLagTxt = new TextComponent(`&3Block During Lag&f: ${config.blockDuringLag? "&aEnabled": "&cDisabled"}`).setClick("run_command", "/blockduringlag").setHover("show_text", "/blockduringlag")
    const message1 = new Message(blockWrongClicksTxt, "&f&l | &r", blockDuringLagTxt)
    ChatLib.chat(message1)
}).setName("blockwrongclicks")

register("command", () => {
    config.blockDuringLag = !config.blockDuringLag
    config.save()

    const blockWrongClicksTxt = new TextComponent(`&3Block Wrong Clicks&f: ${config.blockWrongClicks? "&aEnabled": "&cDisabled"}`).setClick("run_command", "/blockwrongclicks").setHover("show_text", "/blockwrongclicks")
    const blockDuringLagTxt = new TextComponent(`&3Block During Lag&f: ${config.blockDuringLag? "&aEnabled": "&cDisabled"}`).setClick("run_command", "/blockduringlag").setHover("show_text", "/blockduringlag")
    const message1 = new Message(blockWrongClicksTxt, "&f&l | &r", blockDuringLagTxt)
    ChatLib.chat(message1)
}).setName("blockduringlag")

register("command", () => {
    config.sounds = !config.sounds
    config.save()

    const soundsTxt = new TextComponent(`&3Sounds&f: ${config.sounds? "&aEnabled": "&cDisabled"}`).setClick("run_command", "/sounds").setHover("show_text", "/sounds")
    const messagesTxt = new TextComponent(`&3Messages&f: ${config.messages? "&aEnabled": "&cDisabled"}`).setClick("run_command", "/messages").setHover("show_text", "/messages")
    const message2 = new Message(soundsTxt, "&f&l | &r", messagesTxt)
    ChatLib.chat(message2)
}).setName("sounds")

register("command", () => {
    config.messages = !config.messages
    config.save()

    const soundsTxt = new TextComponent(`&3Sounds&f: ${config.sounds? "&aEnabled": "&cDisabled"}`).setClick("run_command", "/sounds").setHover("show_text", "/sounds")
    const messagesTxt = new TextComponent(`&3Messages&f: ${config.messages? "&aEnabled": "&cDisabled"}`).setClick("run_command", "/messages").setHover("show_text", "/messages")
    const message2 = new Message(soundsTxt, "&f&l | &r", messagesTxt)
    ChatLib.chat(message2)
}).setName("messages")

register("command", () => {
    const blockWrongClicksTxt = new TextComponent(`&3Block Wrong Clicks&f: ${config.blockWrongClicks? "&aEnabled": "&cDisabled"}`).setClick("run_command", "/blockwrongclicks").setHover("show_text", "/blockwrongclicks")
    const blockDuringLagTxt = new TextComponent(`&3Block During Lag&f: ${config.blockDuringLag? "&aEnabled": "&cDisabled"}`).setClick("run_command", "/blockduringlag").setHover("show_text", "/blockduringlag")
    const soundsTxt = new TextComponent(`&3Sounds&f: ${config.sounds? "&aEnabled": "&cDisabled"}`).setClick("run_command", "/sounds").setHover("show_text", "/sounds")
    const messagesTxt = new TextComponent(`&3Messages&f: ${config.messages? "&aEnabled": "&cDisabled"}`).setClick("run_command", "/messages").setHover("show_text", "/messages")
    const p3StartCountdownTxt = new TextComponent(`&3P3 Start Countdown&f: ${config.P3StartCountdown? "&aEnabled": "&cDisabled"}`).setClick("run_command", "/p3startcountdown toggle").setHover("show_text", "/p3startcountdown toggle")
    const p3StartCountdownMoveTxt = new TextComponent(` &f&l| &r&bMove`).setClick("run_command", "/p3startcountdown move").setHover("show_text", "/p3startcountdown move")
   
    const message1 = new Message("\n", blockWrongClicksTxt, "&f&l | &r", blockDuringLagTxt)
    const message2 = new Message(soundsTxt, "&f&l | &r", messagesTxt)
    const message3 = new Message(p3StartCountdownTxt, p3StartCountdownMoveTxt, "\n")

    ChatLib.chat(message1)
    ChatLib.chat(message2)
    ChatLib.chat(message3)
}).setName("ss").setAliases("simonsays")

let p3StartTitle = `&b5.00`

let timeUntilP3Start = 0
let timeUntilP3StartIncludingFormatting = `&b${timeUntilP3Start}`

moveP3StartGUI = new Gui()

const serverTicksForP3Start = register("packetReceived", () => {
    timeUntilP3Start -= 0.05
    timeUntilP3StartIncludingFormatting = `&b${timeUntilP3Start.toFixed(2)}`
    if (timeUntilP3Start < 0.05) {
        serverTicksForP3Start.unregister()
        overlayForP3Start.unregister()
        return
    }
}).setFilteredClass(S32PacketConfirmTransaction).unregister()

const overlayForP3Start = register("renderOverlay", () => {
    P3StartCount = new Text(timeUntilP3StartIncludingFormatting, config.P3StartGUI.x, config.P3StartGUI.y)
    .setShadow(true).setScale(config.P3StartGUI.scale).setAlign("CENTER")
    P3StartCount.draw()
}).unregister()

register("chat", () => {
    p3juststartedlock = 0
    p3ArmorStandScan.register()
    if (!config.P3StartCountdown) return
    timeUntilP3Start = 5.00
    timeUntilP3StartIncludingFormatting = `&b${timeUntilP3Start.toFixed(2)}`
    serverTicksForP3Start.register()
    overlayForP3Start.register()
}).setCriteria("[BOSS] Storm: I should have known that I stood no chance.")

register("command", (a) => {
    if (a == "move") {
        moveP3StartGUI.open()
        setTimeout(() => {
            moveTempTitle.register()
            drag.register()
            scroll.register()
        }, 100);
    }
    else if (a == "toggle") {
        config.P3StartCountdown = !config.P3StartCountdown
        config.save()

        const p3StartCountdownTxt = new TextComponent(`&3P3 Start Countdown&f: ${config.P3StartCountdown? "&aEnabled": "&cDisabled"}`).setClick("run_command", "/p3startcountdown toggle").setHover("show_text", "/p3startcountdown toggle")
        const p3StartCountdownMoveTxt = new TextComponent(` &f&l| &r&bMove`).setClick("run_command", "/p3startcountdown move").setHover("show_text", "/p3startcountdown move")
        const message3 = new Message(p3StartCountdownTxt, p3StartCountdownMoveTxt)
        ChatLib.chat(message3)
    }
    else ChatLib.chat("&cInvalid usage of '/p3startcountdown [toggle/move]'")
}).setName("p3startcountdown")

const moveTempTitle = register("renderOverlay", () => {
    if (moveP3StartGUI.isOpen()) {
        P3StartText = new Text(p3StartTitle, config.P3StartGUI.x, config.P3StartGUI.y)
        .setShadow(true).setScale(config.P3StartGUI.scale).setAlign("CENTER")
        P3StartText.draw()
    }
    else {
        moveTempTitle.unregister()
        drag.unregister()
        scroll.unregister()
    }
}).unregister()

const drag = register("dragged", (dx, dy, x, y, bn) => {
    if (moveP3StartGUI.isOpen() && (bn != 2)) {
        config.P3StartGUI.x = (x).toFixed(1)
        config.P3StartGUI.y = (y).toFixed(1)
        config.save()
    }
}).unregister()

const scroll = register("scrolled", (x, y, dir) => {
    if (moveP3StartGUI.isOpen()) {
        if (dir == 1) config.P3StartGUI.scale = (parseFloat(config.P3StartGUI.scale) + 0.05).toFixed(2)
        else config.P3StartGUI.scale = (parseFloat(config.P3StartGUI.scale) - 0.05).toFixed(2)
        config.save()
    }
}).unregister()


const serverTasks = [];

const serverScheduleTaskRegister = register("packetReceived", (packet) => {
    let tasksToRun = [];

    for (let i = serverTasks.length - 1; i >= 0; i--) {
        serverTasks[i].delay--;

        if (serverTasks[i].delay <= 0) {
            tasksToRun.push(serverTasks[i].func);
            serverTasks.splice(i, 1);
        }
    }

    tasksToRun.forEach(func => func());
}).setFilteredClass(S32PacketConfirmTransaction).unregister()