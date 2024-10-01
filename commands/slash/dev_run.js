const util = require("util")

module.exports = {
metadata: {
    dev: true,
    name: "run",
    description: "(dev) Evalute JS code, 100% very much safely.",
    args: [
        { type: "string", name: "code", description: "Some JS code to very safely evaluate", required: true }
    ]
},

async run(client, int, tools) {

    let code = int.options.get("code").value
    let db = await client.db.fetch(int.guild.id)

    return Promise.resolve().then(() => {
      return eval(code)
    })
    .then(x => {
        if (typeof x !== "string") x = util.inspect(x)
        int.reply(x || "** **").catch((e) => {
            int.reply("✅").catch(() => {})
        });
    })
    .catch(e => { int.reply(`**Error:** ${e.message}`); console.warn(e) })

}}