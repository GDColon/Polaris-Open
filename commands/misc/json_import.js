const Tools = require("../../classes/Tools.js")
let tools = Tools.global

module.exports = {

    async run(client, serverID, importSettings={}, jsonData) {

        let details = []
        let newData = {}
        let importedUsers = 0

        if (jsonData.xp) jsonData.users = jsonData.xp  // in case someone messes this up
        if (!jsonData.users && !jsonData.settings && jsonData instanceof Object && !Array.isArray(jsonData)) jsonData = { users: jsonData }   // if no keys provided, assume it's just XP

        if (jsonData.users && importSettings.xp) {
            let userEntries = Object.entries(jsonData.users)
            if (!importSettings.isDev && userEntries.length > 2000) return { error: "You can only import up to 2000 users, unless you're a developer of the bot! Remove any invalid IDs, or users with low XP." }

            userEntries.forEach(u => {
                const [id, x] = u
                if (id.match(/\d{16,20}/g) && !isNaN(x?.xp)) {
                    importedUsers++

                    // validate the values here, since the db doesn't
                    let obj = { xp: Number(x.xp) }
                    if (!isNaN(x.cooldown)) obj.cooldown = Math.round(x.cooldown)
                    if (x.hidden) obj.hidden = true

                    newData[`users.${id}`] = obj
                }
            })
            details.push(`${tools.commafy(importedUsers)} user${importedUsers == 1 ? "" : "s"}`)
        }

        if (jsonData.settings && importSettings.settings) {
            newData["settings"] = jsonData.settings  // this should really really really really be validated but the schema is enough for me ¯\_(ツ)_/¯ 
            details.push(`Server settings`)
        }

        if (!details.length) return { error: `No JSON data found! Syntax is { users: {...} }, settings: {...} }` }

        return { data: newData, details }

    }
    
}