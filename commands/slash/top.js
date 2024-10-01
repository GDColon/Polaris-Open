const PageEmbed = require("../../classes/PageEmbed.js")

module.exports = {
metadata: {
    name: "top",
    description: "View the server's XP leaderboard.",
    args: [
        { type: "integer", name: "page", description: "Which page to view (negative to start from last page)", required: false },
        { type: "user", name: "member", description: "Finds a certain member's position on the leaderboard (overrides page)", required: false },
        { type: "bool", name: "hidden", description: "Hides the reply so only you can see it", required: false }
    ]
},

async run(client, int, tools) {

    let lbLink = `${tools.WEBSITE}/leaderboard/${int.guild.id}`

    let db = await tools.fetchAll()
    if (!db || !db.users || !Object.keys(db.users).length) return tools.warn(`Nobody in this server is ranked yet!`);
    else if (!db.settings.enabled) return tools.warn("*xpDisabled")
    else if (db.settings.leaderboard.disabled) return tools.warn("The leaderboard is disabled in this server!" + (tools.canManageServer(int.member) ? `\nAs a moderator, you can still privately view the leaderboard here: ${lbLink}` : ""))

    let pageNumber = int.options.get("page")?.value || 1
    let pageSize = 10

    let minLeaderboardXP = db.settings.leaderboard.minLevel > 1 ? tools.xpForLevel(db.settings.leaderboard.minLevel, db.settings) : 0
    let rankings = tools.xpObjToArray(db.users)
    rankings = rankings.filter(x => x.xp > minLeaderboardXP && !x.hidden).sort(function(a, b) {return b.xp - a.xp})

    if (db.settings.leaderboard.maxEntries > 0) rankings = rankings.slice(0, db.settings.leaderboard.maxEntries)

    if (!rankings.length) return tools.warn("Nobody in this server is on the leaderboard yet!")

    let highlight = null
    let userSearch = int.options.get("user") || int.options.get("member") // option is "user" if from context menu
    if (userSearch) {
        let foundRanking = rankings.findIndex(x => x.id == userSearch.user.id)
        if (isNaN(foundRanking) || foundRanking < 0) return tools.warn(int.user.id == userSearch.user.id ? "You aren't on the leaderboard!" : "This member isn't on the leaderboard!")
        else pageNumber = Math.floor(foundRanking / pageSize) + 1
        highlight = userSearch.user.id
    }

    let listCol = db.settings.leaderboard.embedColor
    if (listCol == -1) listCol = null

    let embed = tools.createEmbed({
        color: listCol || tools.COLOR,
        author: {name: 'Leaderboard for ' + int.guild.name, iconURL: int.guild.iconURL()}
    })

    let isHidden = db.settings.leaderboard.ephemeral || !!int.options.get("hidden")?.value

    let xpEmbed = new PageEmbed(embed, rankings, {
        page: pageNumber, size: pageSize, owner: int.user.id,  ephemeral: isHidden,
        mapFunction: (x, y, p) => `**${p})** ${x.id == highlight ? "**" : ""}Lv. ${tools.getLevel(x.xp, db.settings)} - <@${x.id}> (${tools.commafy(x.xp)} XP)${x.id == highlight ? "**" : ""}`,
        extraButtons: [ tools.button({style: "Link", label: "Online Leaderboard", url: lbLink}) ]
    })
    if (!xpEmbed.data.length) return tools.warn("There are no members on this page!")

    xpEmbed.post(int)

}}