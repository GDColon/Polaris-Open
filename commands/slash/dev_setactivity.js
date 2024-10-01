const fs = require("fs")

module.exports = {
metadata: {
    dev: true,
    name: "setactivity",
    description: "(dev) Change the bot's status",
    args: [
        { type: "string", name: "type", description: "Activity type", required: true, choices: [
            {name: "Custom", value: "Custom"},
            {name: "Playing", value: "Playing"},
            {name: "Watching", value: "Watching"},
            {name: "Listening to", value: "Listening"},
            {name: "*Current", value: "current"},
            {name: "*Reset", value: "reset"},
            {name: "*Clear", value: "clear"},
        ]},
        { type: "string", name: "name", description: "Custom activity name", required: true },
        { type: "string", name: "state", description: "Custom state", required: false },
        { type: "string", name: "url", description: "Stream URL", required: false },
        { type: "string", name: "status", description: "Online status", required: false, choices: [
            {name: "Online", value: "online"},
            {name: "Idle", value: "idle"},
            {name: "Do Not Disturb", value: "dnd"},
            {name: "Offline", value: "offline"},
        ]},
    ]
},

async run(client, int, tools) {

    const statusInfo = require("../../json/auto/status.json")  // placed inside run to guarantee it exists

    let type = int.options.get("type")?.value
    let name = int.options.get("name")?.value
    let state = int.options.get("state")?.value
    let status = int.options.get("status")?.value || "online"
    let url = int.options.get("url")?.value || null

    if (!state && type == "Custom") state = name

    if (url) type = "Streaming"

    else if (type == "current") {
        type = statusInfo.type
        name = statusInfo.name
        status = statusInfo.status
    }

    else if (type == "reset") {
        type = statusInfo.default.type
        name = statusInfo.default.name
        status = "online"
    }

    else if (type == "clear") {
        type = ""
        name = ""
    }
    
    int.reply("✅ **Status updated!**")

    statusInfo.name = name
    statusInfo.state = state || ""
    statusInfo.type = type
    statusInfo.url = url
    statusInfo.status = status
    client.statusData = statusInfo
    fs.writeFileSync('./json/auto/status.json', JSON.stringify(statusInfo, null, 2))

    client.shard.broadcastEval(async (cl, xd) => {
        cl.statusData = xd
        cl.updateStatus()
    }, { context: statusInfo })
 
}}