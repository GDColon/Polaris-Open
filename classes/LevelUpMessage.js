const ordinal = require('ordinal/indicator');
const LevelUpEmbed = require("./LevelUpEmbed.js")
const Tools = require("./Tools.js")
const tools = Tools.global

const ifLevelRegex = /\[\[\s*IFLEVEL\s*([=></!%]+)\s*(\d+)\s*\|(.+?)\]\]/
const ordinalRegex = /(\d+)(\s*)\[\[\s*NTH\s*\]\]/

class LevelUpMessage {
    constructor(settings, message, data={}) {

        this.channel = settings.levelUp.channel
        this.msg = settings.levelUp.message
        this.userMessage = message
        this.level = data.level

        let roleList = data.roleList || message.guild.roles.cache
        this.rewardRoles = settings.rewards.filter(x => x.level == data.level).map(x => roleList.find(r => r.id == x.id)).filter(x => x)

        if (settings.levelUp.rewardRolesOnly && !this.rewardRoles.length && !data.example) {
            this.invalid = true;
            return
        }
        
        this.variables = {
            "LEVEL": tools.commafy(data.level),
            "OLD_LEVEL": tools.commafy(data.oldLevel ?? data.level - 1),
            "XP": tools.commafy(data.userData.xp),
            "NEXT_LEVEL": Math.min(data.level + 1, settings.maxLevel),
            "NEXT_XP": tools.commafy(tools.xpForLevel(data.level + 1, settings) - data.userData.xp),
            "@": `<@${message.author.id}>`,
            "USERNAME": message.author.username,
            "DISPLAYNAME": message.author.displayName,
            "DISCRIM": message.author.discriminator,
            "ID": message.author.id,
            "NICKNAME": message.member.displayName,
            "AVATAR": message.member.avatarLink || message.member.displayAvatarURL({format: "png", dynamic: true}),
            "SERVER": message.guild.name,
            "SERVER_ID": message.guild.id,
            "SERVER_ICON": message.guild.iconLink || message.guild.iconURL({format: "png", dynamic: true}) || "", 
            "CHANNEL": `<#${message.channel.id}>`,
            "CHANNEL_NAME": message.channel.name,
            "CHANNEL_ID": message.channel.id,
            "ROLE": this.rewardRoles.map(x => `<@&${x.id}>`).join(" "),
            "ROLE_NAME": this.rewardRoles.map(x => x.name).join(", "),
            "TIMESTAMP": Math.round(Date.now() / 1000),
            "EMBEDTIMESTAMP": new Date().toISOString()
        }

        if (settings.levelUp.embed) {
            let mbed = new LevelUpEmbed(this.msg)
            if (mbed.invalid) {
                this.msg = ""
                this.invalid = true
            }
            else {
                let mbedJSON = mbed.json(false)

                // add vars to all strings
                for (const [key, val] of Object.entries(mbedJSON)) {
                    if (typeof val == "string") mbedJSON[key] = this.subVariables(val)

                    // go one extra layer deep lmao
                    else if (val && typeof val == "object" && !Array.isArray(val)) {
                        for (const [key2, val2] of Object.entries(val)) {
                            if (typeof val2 == "string") mbedJSON[key][key2] = this.subVariables(val2)
                        }
                    }
                }

                // add vars to fields
                    if (mbedJSON.fields && mbedJSON.fields.length) {
                    mbedJSON.fields = mbedJSON.fields.map(f => ({ name: this.subVariables(f.name), value: this.subVariables(f.value), inline: f.inline }))
                }
                
                this.msg = { embeds: [ mbedJSON ] }
                if (mbed.extraContent) this.msg.content = this.subVariables(mbed.extraContent)
            }
        }

        else this.msg =  { content: this.subVariables(this.msg) }

        if (this.msg) this.msg.reply = { messageReference: message.id }
    }

    subVariables(msg) {

        if (!msg) return msg
        let newMsg = msg.replace(/\n/g, "　")
        let newLevel = this.level

        // simple variables
        let vars = this.variables        
        newMsg = newMsg.replace(/\[\[[A-Z@_ ]+\]\]/g, function(str) {
            let v = str.slice(2, -2).trim()
            return vars[v] ?? str
        })

        // random choose
        newMsg = newMsg.replace(/\[\[\s*CHOOSE.+?\]\]/g, function(str) {
            let pool = []
            let totalWeight = 0
            let choose = str.slice(2, -2).split(/(?<!\|)\|(?!\|)/).map(x => x.trim()).filter(x => x) // split at one | but not more
            choose[0] = choose[0].replace(/^\s*CHOOSE\s*/, "")
            if (!choose[0]) choose.shift()

            let chooseRegex = /^<([\d.]+)>\s+/
            if (choose.some(x => x.match(chooseRegex))) { // if list has weighting...
                choose.forEach(c => {
                    let weightMatch = c.match(chooseRegex)
                    let weight = weightMatch ? (Number(weightMatch[1])) || 1 : 1
                    if (weight > 0) {
                        weight = tools.clamp(Math.round(weight * 500), 1, 1e6)
                        pool.push({ msg: c.replace(chooseRegex, ""), weight, index: totalWeight })
                        totalWeight += weight
                    }
                })
    
                let roll = tools.rng(0, totalWeight)
                let finalChoice = pool.reverse().find(x => roll >= x.index)
                return finalChoice.msg
            }

            else return tools.choose(choose)
        })

        // if level
        newMsg = newMsg.replace(new RegExp(ifLevelRegex, "g"), function(str) {
            let match = str.match(ifLevelRegex)
            let [all, operation, lvl, data] = match
            if (!data) return
            data = (data).trim()
            lvl = Number(lvl)
            if (isNaN(lvl)) return ""

            switch (operation.trim()) {
                case ">": return (newLevel > lvl ? data : "")
                case "<": return (newLevel < lvl ? data : "")
                case ">=": case "=>": return (newLevel >= lvl ? data : "")
                case "<=": case "=<": return (newLevel <= lvl ? data : "")
                case "!=": case "=!": case "=/": case "=/=": return (newLevel != lvl ? data : "")
                case "/": case "%": return (newLevel % lvl == 0 ? data : "")
                default: return (newLevel == lvl ? data : "")
            }
        })
        
        let rewardRoles = this.rewardRoles

        // if role
        newMsg = newMsg.replace(/\[\[\s*IFROLE\s*\|.+?\]\]/g, function(str) {
            if (!rewardRoles.length) return ""
            else return str.split("|").slice(1).join("|").slice(0, -2)
        })

        // if no role
        newMsg = newMsg.replace(/\[\[\s*IFNOROLE\s*\|.+?\]\]/g, function(str) {
            if (rewardRoles.length) return ""
            else return str.split("|").slice(1).join("|").slice(0, -2)
        })

        // nth
        newMsg = newMsg.replace(new RegExp(ordinalRegex, "g"), function(str) {
            let match = str.match(ordinalRegex)
            if (match) {
                let num = (Number(match[1]) || 0)
                let spacing = match[2] || ""
                return `${num}${spacing}${ordinal(num)}`
            }
        }).replace(/\[\[\s*NTH\s*\]\]/g, "")

        return newMsg.replace(/　/g, "\n").trim()

    }

    async send() {
        if (!this.msg || this.invalid) return
        let sendChannel = this.channel
        let ch =
            (sendChannel == "current") ? this.userMessage.channel
            : (sendChannel == "dm") ? this.userMessage.author
            : await this.userMessage.guild.channels.fetch(sendChannel).catch(() => {})

        if (ch && ch.id) ch.send(this.msg).catch((e) => {
            ch.send(`**Error sending level up message!**\n\`\`\`${e.message}\`\`\`\n(anyways, congrats on level ${this.variables.LEVEL}!)`).catch(() => {})
        })
    }
}

module.exports = LevelUpMessage;