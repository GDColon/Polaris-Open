const Discord = require("discord.js")
const schema = require("../../database_schema.js").settingsIDs

module.exports = {
metadata: {
    name: "button:settings_edit",
},

async run(client, int, tools, modal) {

    let buttonData = int.customId.split("~")
    if (!modal && buttonData[2] != int.user.id) return int.deferUpdate() 

    let settingID = modal || buttonData[1]
    let setting = schema[settingID]
    if (!setting) return tools.warn("Invalid setting!")

    let isBool = setting.type == "bool"
    let isNumber = (setting.type == "int" || setting.type == "float")

    if (!modal) {
        if (isNumber) {
            let numModal = new Discord.ModalBuilder()
            .setCustomId(`configmodal~${settingID}~${int.user.id}`)
            .setTitle("Edit setting")
    
            let numOption = new Discord.TextInputBuilder()
            .setLabel("New value")
            .setStyle(Discord.TextInputStyle.Short)
            .setCustomId("configmodal_value")
            .setMaxLength(20)
            .setRequired(true)
            if (!isNaN(setting.min) && !isNaN(setting.max)) numOption.setPlaceholder(`${tools.commafy(setting.min)} - ${tools.commafy(setting.max)}`)
    
            let numRow = new Discord.ActionRowBuilder().addComponents(numOption)
            numModal.addComponents(numRow)
            return int.showModal(numModal);
        }    
    }


    let db = await tools.fetchSettings()
    if (!db) return tools.warn("*noData")

    let settings = db.settings
    if (!tools.canManageServer(int.member, settings.manualPerms)) return tools.warn("*notMod")

    let newValue;
    let oldValue = tools.getSettingFromID(settingID, settings);

    if (isBool) newValue = !oldValue

    else if (isNumber) {
        let modalVal = int.fields.getTextInputValue("configmodal_value")

        if (modalVal) {
            let num = Number(modalVal)
            if (isNaN(num)) return int.deferUpdate()

            if (setting.type == "int") num = Math.round(num)

            if (!isNaN(setting.min) && num < setting.min) num = setting.min
            else if (!isNaN(setting.max) && num > setting.max) num = setting.max

            newValue = num
        }
    }

    if (newValue === undefined || newValue == oldValue) return int.deferUpdate()

    client.db.update(int.guild.id, { $set: { [`settings.${settingID}`]: newValue, 'info.lastUpdate': Date.now() }}).then(() => {
        client.commands.get("button:settings_view").run(client, int, tools, ["val", null, settingID])
    }).catch(() => tools.warn("Something went wrong while trying to change this setting!"))

}}