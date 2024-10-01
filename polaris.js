const Discord = require("discord.js")
require('dotenv').config();

const token = process.env.DISCORD_TOKEN
if (!token) return console.log("No Discord token provided! Put one in your .env file")

const Shard = new Discord.ShardingManager('./index.js', { token } );
const guildsPerShard = 2000

Discord.fetchRecommendedShardCount(token, {guildsPerShard}).then(shards => {
    let shardCount = Math.floor(shards)
    console.info(shardCount == 1 ? "Starting up..." : `Preparing ${shardCount} shards...`)
    Shard.spawn({amount: shardCount, timeout: 60000}).catch(console.error)
    Shard.on('shardCreate', shard => {
        shard.on("disconnect", (event) => {
            console.warn(`Shard ${shard.id} disconnected!`); console.log(event);
        });
        shard.on("death", (event) => {
            console.warn(`Shard ${shard.id} died!\nExit code: ${event.exitCode}`);
        });
        shard.on("reconnecting", () => {
            console.info(`Shard ${shard.id} is reconnecting!`);
        });
            
    })
}).catch(e => {console.log(e.headers || e)})