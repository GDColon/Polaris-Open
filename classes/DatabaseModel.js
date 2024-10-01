// for the sake of the open source project, i've moved all the database methods here. maybe it'll help if you wanna switch to a different db

const mongoose = require("mongoose")

// connect to database
const uri = process.env.MONGO_DB_URI
const dbName = process.env.MONGO_DB_NAME || "polaris"
const dbSettings = uri ? { dbName } : { dbName, user: process.env.MONGO_DB_USERNAME, pass: process.env.MONGO_DB_PASSWORD }

mongoose.connect(uri || `mongodb://${process.env.MONGO_DB_IP}`, dbSettings)
.then(() => console.log(`Database connected! (${+process.uptime().toFixed(2)} secs)`))
.catch(e => { console.error('\x1b[40m\x1b[31m%s\x1b[0m', "!!! Error connecting to the database !!!"); console.error(e) })

class Model {
    constructor(collectionName, schema) {
        this.schema = schema;
        this.model = mongoose.model(collectionName, this.schema);

        this.fetch = (id, filter, options) => this.model.findById(id, filter, options);
        this.update = (id, data, options) => this.model.findByIdAndUpdate(id, data, options);
        this.create = (data, options) => this.model.create(data, options);
        this.find = (query, filter, options) => this.model.find(query, filter, options);
        this.delete = (query, options) => this.model.deleteMany(query, options);
    }
}

module.exports = Model;