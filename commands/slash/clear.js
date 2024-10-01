module.exports = {
metadata: {
    permission: "ManageGuild",
    name: "clear",
    description: "Clear a member's cooldown. (requires manage server permission)",
    args: [
        { type: "user", name: "member", description: "Which member to clear", required: true }
    ]
},

async run(client, int, tools) {

    const user = int.options.get("member")?.user

    let db = await tools.fetchSettings(user.id)
    if (!db) return tools.warn("*noData")
    else if (!tools.canManageServer(int.member, db.settings.manualPerms)) return tools.warn("*notMod")
    else if (!db.settings.enabled) return tools.warn("*xpDisabled")

    if (user.bot) return tools.warn("Bots don't have cooldowns, silly!")

    let current = db.users[user.id]
    let cooldown = current?.cooldown
    if (!cooldown || cooldown <= Date.now()) return tools.warn("This member doesn't have an active cooldown!")

    client.db.update(int.guild.id, { $set: { [`users.${user.id}.cooldown`]: 0 } }).then(() => {
        int.reply(`🔄 **${tools.pluralS(user.displayName)} cooldown has been reset!** (previously ${tools.timestamp(cooldown - Date.now())})`)
    }).catch(() => tools.warn("Something went wrong while trying to reset the cooldown!"))

}}