const Discord = require('discord.js')
const config = require("../../json/quick_settings.json")
const schema = require("../../database_schema.js").settingsIDs

const rootFolder = "home"

module.exports = {
metadata: {
    name: "button:settings_list",
},

async run(client, int, tools, selected) {

    let buttonData = [];
    if (int.isButton) {
        buttonData = int.customId.split("~")
        if (buttonData[2] && buttonData[2] != int.user.id) return int.deferUpdate() 
    }

    let db = await tools.fetchSettings()
    if (!db) return tools.warn("*noData")

    let settings = db.settings
    if (!tools.canManageServer(int.member, settings.manualPerms)) return tools.warn("*notMod")

    // displays the preview value for a setting
    function previewSetting(val, data, schema) {
        if (data.zeroText && val === 0) return data.zeroText
        switch(schema.type) {
            case "bool": return (data.invert ? !val : val) ? "__True__" : "False";
            case "int": return tools.commafy(val);
            case "float": return tools.commafy(Number(val.toFixed(schema.precision || 4)));
        }
        return val.toString()
    }

    function getDataEmoji(type, val) {
        if (type == "bool") return val ? "✅" : "❎"
        else if (type == "int" || type == "float") return "#️⃣"
        else return "📝"
    }

    let dirName = (selected ? selected[1] : int.isButton ? buttonData[1] : rootFolder) || rootFolder
    let entries = config[dirName]

    if (!entries) return tools.warn("Invalid category!")

    let rows = []
    let options = []
    let groupName = "Settings"
    let isHome = (dirName == rootFolder)

    entries.forEach(x => {
        if (x.groupName) groupName = x.groupName
        
        if (x.folder) {
            let emoji = x.emoji || "📁"
            rows.push(`${emoji} **${x.name}**`)
            options.push({ emoji, label: x.name, value: `config_dir_${x.folder}` })
        }

        else if (x.db) {
            let val = tools.getSettingFromID(x.db, settings)
            let sch = schema[x.db]
            rows.push(`**${x.name}**: ${previewSetting(val, x, sch)}`)
            options.push({ emoji: getDataEmoji(sch.type, val), label: x.name, description: tools.limitLength(x.desc, 95), value: `config_val_${dirName}_${x.db}` })
        }

        if (x.space || x.folder == "home") rows.push("")
    })

    let embed = tools.createEmbed({
        color: tools.COLOR,
        title: groupName,
        description: rows.join("\n"),
        footer: isHome ? "Most basic settings can be toggled from here" : null
    })

    let dropdown = new Discord.StringSelectMenuBuilder()
    .setCustomId(`configmenu_${int.user.id}`)
    .setPlaceholder(isHome ? "Choose category..." : "Choose setting...")
    .addOptions(...options)

    tools.editOrReply({ embeds: [embed], components: tools.row(dropdown) }, !buttonData[2])
}}