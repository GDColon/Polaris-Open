const util = require("util")

module.exports = {
metadata: {
    dev: true,
    name: "db",
    description: "(dev) View or modify database stuff.",
    args: [
        { type: "string", name: "property", description: "Property name (e.g. settings.enabled)", required: false },
        { type: "string", name: "new_value", description: "New value for the property (parsed as JSON)", required: false },
        { type: "string", name: "guild_id", description: "Guild ID to use (defaults to current guild)", required: false }
    ]
},

async run(client, int, tools) {

    const propertyName = int.options.get("property")
    const newValue = int.options.get("new_value")
    const providedGuild = int.options.get("guild_id")

    let guildID = providedGuild?.value || int.guild.id
    let db = await client.db.fetch(guildID)
    if (!db) return int.reply("No data!")

    let cleanDB = { _id: db._id, settings: db.settings || {}, users: db.users || {} }

    if (!propertyName) {
        let uniqueMembers = Object.keys(cleanDB.users).length
        if (uniqueMembers > 16) cleanDB.users = `(${uniqueMembers} entries)`
        return int.reply(util.inspect(cleanDB))
    }

    else if (!newValue) {
        Promise.resolve().then(() => eval(`db.${propertyName.value}`)) // lmao
        .then(x => int.reply(tools.limitLength(util.inspect(x), 1900)))
        .catch(e => int.reply(`**Error:** ${e.message}`))
    }

    else {
        let val = newValue.value
        try { val = JSON.parse(newValue.value) }
        catch(e) { newValue.value }

        let confirmMsg = { content: `Click to update **${propertyName.value}** to: [${typeof val}] ${tools.limitLength(JSON.stringify(val), 256)}` }
        tools.createConfirmationButtons({
            message: confirmMsg, buttons: "Update!", secs: 30, timeoutMessage: "Update cancelled",
            onClick: function(confirmed, msg, b) {
               if (!confirmed) return msg.reply("Update cancelled")
               else {
                    client.db.update(guildID, { $set: { [propertyName.value]: val } }).exec().then(() => {
                        msg.reply(`✅ Successfully updated **${propertyName.value}**!`)
                    }).catch(e => msg.reply("Update failed! " + e.message))
               }
            }
        })
    }

 
}}