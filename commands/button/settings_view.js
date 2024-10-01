const config = require("../../json/quick_settings.json")
const schema = require("../../database_schema.js").settingsIDs

module.exports = {
metadata: {
    name: "button:settings_view",
},

async run(client, int, tools, selected) {

    let db = await tools.fetchSettings()
    if (!db) return tools.warn("*noData")

    let settings = db.settings
    if (!tools.canManageServer(int.member, settings.manualPerms)) return tools.warn("*notMod")

    let group = selected[1]
    let settingID = selected[2]
    let setting = schema[settingID]

    if (!setting) return tools.warn("Invalid setting!")

    // find group the hard way, if not provided
    if (!group) {
        for (const [g, x] of Object.entries(config)) {
            if (x.find(z => z.db == settingID)) {
                group = g
                break;
            }
        }
    }

    let val = tools.getSettingFromID(settingID, settings)
    let data = config[group].find(x => x.db == settingID)

    function previewSetting(val) {
        if (data.zeroText && val === 0) return `0 (${data.zeroText})`
        else switch(setting.type) {
            case "bool": return ((data.invert ? !val : val) ? "True" : "False");
            case "int": return tools.commafy(+val);
            case "float": return tools.commafy(Number(val.toFixed(setting.precision || 8)));
        }
        return val.toString()
    }

    let currentVal = previewSetting(val)
    
    let footer = data.tip || ""
    if (setting.default !== undefined) footer += `${footer ? "\n" : ""}Default: ${previewSetting(setting.default)}`

    let embed = tools.createEmbed({
        color: tools.COLOR,
        title: data.name,
        description: `**Current value:** ${currentVal}\n\n💡 ${data.desc}`,
        footer: footer || null
    })

    let buttons = tools.button([
        {style: "Secondary", label: "Back", customID: `settings_list~${group}~${int.user.id}`},
        {style: "Primary", label: (setting.type == "bool") ? "Toggle" : "Edit", customId: `settings_edit~${settingID}~${int.user.id}`}
    ])

    tools.editOrReply({embeds: [embed], components: tools.row(buttons)})

}}