module.exports = {
metadata: {
    permission: "ManageGuild",
    name: "multiplier",
    description: "Add or remove an XP multiplier. (requires manage server permission)",
    args: [
        { type: "subcommand", name: "role", description: "Add or remove a role multiplier", args: [
            { type: "role", name: "role_name", description: "The role to add a multiplier for", required: true },
            { type: "float", name: "multiplier", description: "Multiply XP gain by this amount (0.5, 2, etc), or 0 to disable XP gain", min: 0, max: 100, required: true },
            { type: "bool", name: "remove", description: "Removes this multiplier, if it exists" }
        ]},

        { type: "subcommand", name: "channel", description: "Add or remove a channel multiplier", args: [
            { type: "channel", name: "channel_name", description: "The channel or category to add a multiplier for", required: true, acceptAll: true },
            { type: "float", name: "multiplier", description: "Multiply XP gain by this amount (0.5, 2, etc), or 0 to disable XP gain", min: 0, max: 100, required: true },
            { type: "bool", name: "remove", description: "Removes this multiplier, if it exists" }
        ]}
    ]
},

async run(client, int, tools) {

    let db = await tools.fetchSettings()
    if (!tools.canManageServer(int.member, db.settings.manualPerms)) return tools.warn("*notMod")

    let type = int.options.getSubcommand(false)

    let boostVal = int.options.get("multiplier")?.value ?? 1
    
    let role = int.options.getRole("role_name")
    let channel = int.options.getChannel("channel_name")
    let boost = tools.clamp(+boostVal.toFixed(2), 0, 100)
    let remove = !!int.options.get("remove")?.value
    
    if (!channel && !role) return
    let target = (channel || role)
    let tag = role ? `<@&${role.id}>` : `<#${channel.id}>`

    let typeIndex = role ? "roles" : "channels"
    let mults = db.settings.multipliers[typeIndex]
    let existingIndex = mults.findIndex(x => x.id == target.id)
    let foundExisting = (existingIndex >= 0) ? mults[existingIndex] : null

    let newList = db.settings.multipliers
    if (foundExisting) db.settings.multipliers[typeIndex].splice(existingIndex, 1)    // remove by default

    function finish(msg) {
        let viewMultipliers = tools.row([
            tools.button({style: role ? "Primary" : "Secondary", label: `Role multipliers (${newList.roles.length})`, customId: "list_multipliers~roles"}),
            tools.button({style: role ? "Secondary" : "Primary", label: `Channel multipliers (${newList.channels.length})`, customId: "list_multipliers~channels"})
        ])

        client.db.update(int.guild.id, { $set: { [`settings.multipliers.${typeIndex}`]: newList[typeIndex], 'info.lastUpdate': Date.now() }}).then(() => {
            return int.reply({ content: msg, components: viewMultipliers })        
        })
    }

    // deleting a multiplier
    if (remove) {
        if (!foundExisting) return tools.warn(`This ${type} never had a multiplier to begin with!`)
        return finish(`❌ **Successfully deleted ${foundExisting.boost}x multiplier for ${tag}.**`)
    }

    // set up multiplier data
    let boostData = { id: target.id, boost }
    newList[typeIndex].push(boostData)
    let boostStr = boost == 0 ? "no XP" : `${boost}x XP`

    // if multiplier already exists, replace it
    if (foundExisting) {
        if (foundExisting.boost == boost) return tools.warn(`This ${type} already gives a ${boost}x multiplier!`)
        return finish(`📝 **${tag} now gives ${boostStr}!** (previously ${foundExisting.boost}x)`)
    }
    
    return finish(`✅ **${tag} now gives ${boostStr}!**`)

}}