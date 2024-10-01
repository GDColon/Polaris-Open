const PageEmbed = require("../../classes/PageEmbed.js")
const Discord = require("discord.js")

module.exports = {
metadata: {
    name: "button:list_multipliers",
},

async run(client, int, tools) {
    let db = await tools.fetchSettings()
    if (!db) return tools.warn("*noData")

    if (!tools.canManageServer(int.member, db.settings.manualPerms)) return tools.warn("*notMod")

    let isChannel = int.customId.split("~")[1] == "channels"
    let mType = isChannel ? "channel" : "role"
    let mList = db.settings.multipliers[isChannel ? "channels" : "roles"]

    if (!mList.length) return tools.warn(`This server doesn't have any ${mType} multipliers!`)

    let embed = tools.createEmbed({
        title: `${tools.capitalize(mType)} Multipliers (${mList.length})`,
        color: tools.COLOR,
        footer: "Add or remove multipliers with /multiplier"
    })

    let multipliers = mList.sort((a, b) => a.boost - b.boost);

    let categories;
    if (isChannel) {
        categories = await int.guild.channels.fetch().then(x => x.filter(c => c.type == Discord.ChannelType.GuildCategory).map(x => x.id))
    }

    let multiplierEmbed = new PageEmbed(embed, multipliers, {
        size: 20, owner: int.user.id,
        mapFunction: (x) => `**${x.boost}x:** ${isChannel ? (categories.includes(x.id) ? `**<#${x.id}>** (category)` : `<#${x.id}>`) : `<@&${x.id}>`}`
    })

    multiplierEmbed.post(int)

}}