const mongoose = require("mongoose")

// Most of the properties below are used for the web server, they are not built into the mongo schema

// type:        the value's data type (bool, int, float, string, collection)
// default:     the default value
// min+max:     for numbers, forces between those values
// precision:   for floats, how many decimal places
// maxlength:   for strings, max length
// accept:      for strings, accepted values. discord:channel and discord:role accept any of those kind of ids

const settings = {
    enabled: { type: "bool", default: false },

    gain: {
        min: { type: "int", default: 50, min: 0, max: 5000 },
        max: { type: "int", default: 100, min: 0, max: 5000 },
        time: { type: "float", precision: 4, default: 60, min: 0, max: 31536000 },
    },

    curve: {
        3: { type: "float", precision: 10, default: 1, min: 0, max: 100 },
        2: { type: "float", precision: 10, default: 50, min: 0, max: 10000 },
        1: { type: "float", precision: 10, default: 100, min: 0, max: 100000 },
    },
    rounding: { type: "int", default: 100, min: 1, max: 1000  },
    maxLevel: { type: "int", default: 1000, min: 1, max: 1000  },

    levelUp: {
        enabled: { type: "bool", default: false },
        embed: { type: "bool", default: false },
        rewardRolesOnly: { type: "bool", default: false },
        message: { type: "string", maxlength: 6000, default: "" },
        channel: { type: "string", default: "current", accept: ["dm", "current", "discord:channel"] },
        multiple: { type: "int", default: 1, min: 1, max: 1000 },
        multipleUntil: { type: "int", default: 20, min: 0, max: 1000 }
    },

    multipliers: {
        roles: { type: "collection", values: {
            id: { type: "string", accept: ["discord:role"] },
            boost: { type: "float", min: 0, max: 100, precision: 4 },
        }},
        rolePriority: { type: "string", default: "largest", accept: ["largest", "smallest", "highest", "add", "combine"] },
        channels: { type: "collection", values: {
            id: { type: "string", accept: ["discord:channel"] },
            boost: { type: "float", min: 0, max: 100, precision: 4 },
        }},
        channelStacking: { type: "string", default: "multiply", accept: ["multiply", "add", "largest", "channel", "role"] }
    },

    rewards: { type: "collection", values: {
        id: { type: "string", accept: ["discord:role"] },
        level: { type: "int", min: 1, max: 1000 },
        keep: { type: "bool" },
        noSync: { type: "bool" },
    }},

    rewardSyncing: {
        sync: { type: "string", default: "level", accept: ["level", "xp", "never"] },
        noManual: { type: "bool", default: false },
        noWarning: { type: "bool", default: false }
    },

    leaderboard: {
        disabled: { type: "bool", default: false },
        private: { type: "bool", default: false },
        hideRoles: { type: "bool", default: false },
        maxEntries: { type: "int", default: 0, min: 0, max: 1000000 },
        minLevel: { type: "int", default: 0, min: 0, max: 1000 },
        ephemeral: { type: "bool", default: false },
        embedColor: { type: "int", default: -1, min: -1, max: 0xffffff }
    },

    rankCard: {
        disabled: { type: "bool", default: false },
        relativeLevel: { type: "bool", default: false },
        hideCooldown: { type: "bool", default: false },
        ephemeral: { type: "bool", default: false },
        embedColor: { type: "int", default: -1, min: -1, max: 0xffffff }
    },

    hideMultipliers: { type: "bool", default: false },
    manualPerms: { type: "bool", default: false }
}

const settingsArray = []
const settingsObj = {}
const settingsIDs = {}

const schemaTypes = {
    "bool": Boolean,
    "int": Number,
    "float": Number,
    "string": String,
    "collection": [Object]
}

function schemaVal(val) {
    let result = { type: schemaTypes[val.type] }
    if (val.type == "collection") result.default = []
    else if (val.default !== undefined) result.default = val.default
    return result
}

function addToSettingsArray(value, name) {
    let obj = value
    obj.db = name
    settingsArray.push(obj)
    settingsIDs[name] = obj
}

// for settings, create the actual mongo schema
Object.entries(settings).forEach(x => {
    let [key, val] = x
    if (!val.type) {
        let collection = {}
        Object.entries(val).forEach(z => {
            let [innerKey, innerVal] = z
            collection[innerKey] = schemaVal(innerVal)
            addToSettingsArray(innerVal, `${key}.${innerKey}`)
        })
        settingsObj[key] = collection
    }
    else {
        addToSettingsArray(val, key)
        settingsObj[key] = schemaVal(val)
    }
})

const schema = { 
    _id: String,
    users: { type: Object }, // xp, cooldown, hidden. should be validated but it just slows things down
    settings: settingsObj,
    info: {
        lastUpdate: { type: Number, default: 0 },
    }
}

const finalSchema = new mongoose.Schema(schema)

module.exports = {
    settings, settingsArray, settingsIDs, schema: finalSchema
}