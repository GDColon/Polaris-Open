const Discord = require('discord.js')
module.exports = {
metadata: {
    name: "sync",
    description: "Sync your level roles by adding missing ones and removing incorrect ones.",
    args: [
        { type: "user", name: "member", description: "Which member to sync (requires manage server permission)", required: false }
    ]
},

async run(client, int, tools) {

    let foundUser = int.options.get("member")
    let member = foundUser ? foundUser.member : int.member
    if (!int.guild.members.me.permissions.has(Discord.PermissionFlagsBits.ManageRoles)) return tools.warn("*cantManageRoles")

    let db = await tools.fetchSettings(member.id)
    if (!db) return tools.warn("*noData")
    else if (!db.settings.enabled) return tools.warn("*xpDisabled")

    let isMod = db.settings.manualPerms ? tools.canManageRoles() : tools.canManageServer()
    if (member.id != int.user.id && !isMod) return tools.warn("You don't have permission to sync someone else's roles!")

    else if (db.settings.noManual && !isMod) return tools.warn("You don't have permission to sync your level roles!")
    else if (!db.settings.rewards.length) return tools.warn("This server doesn't have any reward roles!")

    let currentXP = db.users[member.id]
    if (!currentXP || !currentXP.xp) return tools.noXPYet(member.user)

    let xp = currentXP.xp
    let level = tools.getLevel(xp, db.settings)

    let currentRoles = member.roles.cache
    let roleCheck = tools.checkLevelRoles(int.guild.roles.cache, currentRoles, level, db.settings.rewards)
    if (!roleCheck.incorrect.length && !roleCheck.missing.length) return int.reply("✅ Your level roles are already properly synced!")

    tools.syncLevelRoles(member, roleCheck).then(() => {
        let replyStr = ["🔄 **Level roles successfully synced!**"]
        if (roleCheck.missing.length) replyStr.push(`Added: ${roleCheck.missing.map(x => `<@&${x.id}>`).join(" ")}`)
        if (roleCheck.incorrect.length) replyStr.push(`Removed: ${roleCheck.incorrect.map(x => `<@&${x.id}>`).join(" ")}`)
        return int.reply(replyStr.join("\n"))
    }).catch(e => int.reply(`Error syncing roles! ${e.message}`))

}}