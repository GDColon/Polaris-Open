module.exports = {
metadata: {
    permission: "ManageGuild",
    name: "config",
    description: "Toggle XP gain, or visit the dashboard to tweak server settings. (requires manage server permission)",
},

async run(client, int, tools) {

    let db = await tools.fetchSettings()
    let settings = db.settings
    if (!tools.canManageServer(int.member, db.settings.manualPerms)) return tools.warn("*notMod")

    let polarisSettings = [
        `**✨ XP enabled: __${settings.enabled ? "Yes!" : "No!"}__**`,
        `**XP per message:** ${settings.gain.min == settings.gain.max ? tools.commafy(settings.gain.min) : `${tools.commafy(settings.gain.min)} - ${tools.commafy(settings.gain.max)}`}`,
        `**XP cooldown:** ${tools.commafy(settings.gain.time)} ${tools.extraS("sec", settings.gain.time)}`,
        `**XP curve:** ${settings.curve[3]}x³ + ${settings.curve[2]}x² + ${settings.curve[1]}x`,
        `**Level up message:** ${settings.levelUp.enabled && settings.levelUp.message ? (settings.levelUp.embed ? "Enabled (embed)" : "Enabled") : "Disabled"}`,
        `**Rank cards:** ${settings.rankCard.disabled ? "Disabled" : settings.rankCard.ephemeral ? "Enabled (forced hidden)" : "Enabled"}`,
        `**Leaderboard:** ${settings.leaderboard.disabled ? "Disabled" : `[${settings.leaderboard.private ? "Private" : "Public"}](<${tools.WEBSITE}/leaderboard/${int.guild.id}>)`}`
    ]

    let embed = tools.createEmbed({
        author: { name: "Settings for " + int.guild.name, iconURL: int.guild.iconURL() },
        footer: "Visit the online dashboard to change server settings",
        color: tools.COLOR, timestamp: true,
        description: polarisSettings.join("\n")
    })

    let toggleButton = settings.enabled ?
      {style: "Danger", label: "Disable XP", emoji: "❕", customId: "toggle_xp" }
    : {style: "Success", label: "Enable XP", emoji: "✨", customId: "toggle_xp" }

    let buttons = tools.button([
        {style: "Success", label: "Edit Settings", emoji: "🛠", customID: "settings_list"},
        toggleButton,
        {style: "Link", label: "Edit Online", emoji: "🌎", url: `${tools.WEBSITE}/settings/${int.guild.id}`},
        {style: "Secondary", label: "Export Data", emoji: "⏏️", customId: "export_xp"}
    ])

    let listButtons = tools.button([
        {style: "Primary", label: `Reward Roles (${settings.rewards.length})`, customId: "list_reward_roles"},
        {style: "Primary", label: `Role Multipliers (${settings.multipliers.roles.length})`, customId: "list_multipliers~roles"},
        {style: "Primary", label: `Channel Multipliers (${settings.multipliers.channels.length})`, customId: "list_multipliers~channels"}
    ])

    return int.reply({embeds: [embed], components: [tools.row(buttons)[0], tools.row(listButtons)[0]]})

}}