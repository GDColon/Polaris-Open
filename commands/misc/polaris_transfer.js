const Tools = require("../../classes/Tools.js")
let tools = Tools.global

module.exports = {

    async run(client, serverID, importSettings={}, guilds) {

        let transferFrom = importSettings.serverID
        let foundServer = guilds.find(x => x.id == transferFrom)

        if (!foundServer) return { error: "Not in server" }
        else if (foundServer && !foundServer.owner) return { error: "Not owner in server" }
        else if (foundServer.id == serverID) return { error: "Cannot transfer from the same server" }

        let toTransfer = []
        if (importSettings.xp) toTransfer.push("users")
        if (importSettings.settings) toTransfer.push("settings")
        if (!toTransfer.length) return { error: "Invalid import options!" }

        let details = []
        let importedUsers = 0

        let transferData = await client.db.fetch(transferFrom, toTransfer)
        if (!transferData) return { error: `No Polaris data found for ${foundServer.name}`, code: "invalidImport" }

        let newData = {}

        if (importSettings.xp) {
            let now = Date.now();
            Object.entries(transferData.users).forEach(u => {
                importedUsers++
                let xpVal = { xp: u[1].xp }
                if (u[1].cooldown && u[1].cooldown > now) xpVal.cooldown = u[1].cooldown
                newData[`users.${u[0]}`] = xpVal
            })
            details.push(`${tools.commafy(importedUsers)} user${importedUsers == 1 ? "" : "s"}`)
        }

        if (importSettings.settings) {
            let currentSettings = await client.db.fetch(serverID, "settings").then(x => x.settings)
            let transferSettings = transferData.settings
            transferSettings.rewards = currentSettings.rewards
            transferSettings.multipliers.roles = currentSettings.multipliers.roles
            transferSettings.multipliers.channels = currentSettings.multipliers.channels
            if (transferSettings.levelUp.channel.length > 8) transferSettings.levelUp.channel = currentSettings.levelUp.channel
            newData["settings"] = transferSettings
            details.push(`Server settings`)
        }

        return { data: newData, details }

    }
    
}