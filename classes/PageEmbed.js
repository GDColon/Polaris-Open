const Tools = require("./Tools.js")
const tools = Tools.global

const activeCollectors = {}

class PageEmbed {
    constructor(embed, data, config={}) {

        this.fullData = data

        this.embed = embed
        this.page = config.page || 1
        this.size = config.size || 10
        this.extraButtons = config.extraButtons || []
        this.mapFunction = config.mapFunction
        this.timeoutSecs = config.timeoutSecs || 30
        this.ownerID = config.owner
        this.ephemeral = config.ephemeral

        this.suffix = embed.data.description
        this.footer = embed.data.footer?.text

        this.pages = Math.floor((this.fullData.length-1) / this.size) + 1
        if (this.page < 0) this.page = this.pages + this.page + 1 // if page is negative, start from last page

        this.data = this.paginate()
        this.setDesc()

        this.int = null

        if (this.ownerID) {
            let foundCollector = activeCollectors[this.ownerID]
            if (foundCollector) {
                foundCollector.stop()
                delete activeCollectors[this.ownerID]
            }
        }

        return this
    }

    paginate(pg=this.page) {
        return this.fullData.slice((pg - 1) * this.size, (pg - 1) * this.size + this.size)
    }

    setDesc() {
        let currentData = this.data
        if (typeof this.mapFunction == "function") currentData = currentData.map((x, y) => {
            let truePos = y + ((this.page - 1) * this.size) + 1
            return this.mapFunction(x, y, truePos)
        })
        return this.embed.setDescription(currentData.join("\n") + (this.suffix ? `\n${this.suffix}` : ""))
    }

    post(int, msgSettings={}) {

        let firstPage = (this.page == 1)
        let lastPage = (this.page >= this.pages)

        let pageOptions = [
            {style: firstPage ? "Secondary" : "Success", label: `<< Page ${firstPage ? this.pages : Math.max((this.page - 1) || 1, 1)}`, customId: 'prev'},
            {style: lastPage ? "Secondary" : "Success", label: `Page ${lastPage ? 1 : Math.min((this.page + 1), this.pages)} >>`, customId: 'next'}
        ]

        if (this.pages == 2) {
            if (this.page == 1) pageOptions.shift()
            else pageOptions.splice(1, 1)
        }

        let pageButtons = this.pages <= 1 ? this.extraButtons : tools.button(pageOptions).concat(this.extraButtons)

        let footerText = this.footer || ""
        if (this.pages > 1) footerText += `\nPage ${this.page} of ${this.pages}`
        if (footerText) this.embed.setFooter({text: footerText})

        let pgButtonRow = pageButtons[0] ? tools.row(pageButtons) : null
        
        if (!this.int) return int.reply(Object.assign({ embeds: [this.embed], components: pgButtonRow, fetchReply: true, ephemeral: this.ephemeral }, msgSettings)).then(msg => {
            this.int = int
            if (this.pages > 1) this.handleButtons(msg, pageButtons)
        }).catch(() => {})

        else return this.int.editReply({embeds: [this.embed], components: pgButtonRow }).then(msg => {
            this.handleButtons(msg, pageButtons)
        }).catch(() => {})
    }

    handleButtons(msg, buttons) {
        let buttonPressed = false
        let collector = msg.createMessageComponentCollector({ time: this.timeoutSecs * 1000 })
        if (this.ownerID) activeCollectors[this.ownerID] = collector
        collector.on('collect', b => {
            if (buttonPressed || !tools.canPressButton(b, [this.ownerID])) return tools.buttonReply(b)
            else buttonPressed = true
            collector.stop()

            switch (b.customId) {
                case "prev": { this.setPage(-1, b); return this.post() }
                case "next": { this.setPage(1, b); return this.post() }
            }
        })
        collector.on('end', b => { 
            if (!buttonPressed) {
                this.int.editReply({ components: tools.disableButtons(buttons) })
                this.destroy()
            }
        })
        return msg.id
    }

    setPage(change, button, exact) {
        if (button) button.deferUpdate()
        let oldPage = this.page

        this.page = exact ? change : oldPage + change
        if (this.page < 1) this.page = this.pages
        if (this.page > this.pages) this.page = 1

        if (oldPage == this.page) return
        this.data = this.paginate()
        this.embed = this.setDesc()
    }

    destroy() {
        delete activeCollectors[this.ownerID]
        this.fullData = null
        this.data = null
        this.embed = null
    }
}

module.exports = PageEmbed;