# Polaris!
...is a super customizable XP bot for Discord with all sorts of neat features!
Unfortunately, it's become increasingly annoying to host, so I'm passing the torch by open-sourcing all the messy code and allowing anyone to host this thing!

If you're an experienced software dev i am so sorry for what comes next

## How do I host it?
It's ""easy!""

### Step 0: Node.js
1. If you don't have node.js, [go get it](https://nodejs.org/en)
2. Once you've set up node, run `npm i` in the bot's root directory
	- If you're new around here, and you're on Windows, you can open up the terminal in a specific directory by shift+rightclicking a blank spot in the folder and pressing Open in Terminal/Powershell/cmd/etc. 

### Step 1: Setting up the bot
Fortunately Discord makes this super easy, thanks Discord
1. Create a Discord Application via the [developer portal](https://discord.com/developers/applications)
	- Name it, decorate it, etc
2. Copy the file named `.env.example`, rename it to `.env`, and open it in a text editor
3. Remove the placeholder values and paste in the application's actual ID, token, and secret.
	- ID can be found in the general tab on the dev portal. It's literally just the bot's account ID
	- A token can be generated from the bot tab. Keep it top secret, you should know this
	- A secret can be generated from the OAuth2 tab
3. On the OAuth2 tab, add `http://localhost:6880/auth` as a redirect URI. You can change the port as long as you do so in config.json as well.
4. Invite the bot to a server by going to [this link](https://discord.com/oauth2/authorize?client_id=123456789&permissions=429765545024&scope=bot%20applications.commands) and replacing "123456789" in the URL with your bot's ID

### Step 2: Set up the config file
1. Open the `config.json` file in the codebase
	- Add a server ID to `test_server_ids`, this is where dev commands will be deployed when you run the bot for the first time
	- Add your own user ID to `developer_ids` so you can run dev commands
	-  `lockBotToDevOnly` makes it so only you can use the bot, for local testing and such
	- There's a couple settings for the web server, you probably don't really need to touch them
	- `siteURL` does **NOT** control the actual URL for your server - it just changes where the bot links users to
	- If you provide a `changelogURL` or `supportURL` they'll appear in /botstatus
2. Test out the bot by opening up your terminal in the root directory and typing `node polaris.js`
	- Most commands won't work due to the lack of a database, but if the bot appears online it means you're good
	- Only dev commands will be present by default, the rest will be deployed in step 4. Dev commands are only visible to server admins and only work if you're specified as a dev in the config file

### Step 3: Setting up the database
Personally I know very little about this topic so if it sounds like I have no idea what I'm saying, it's because I don't. This is just what I do for my own projects.
This step is like the equivalent of learning about port forwarding for your Minecraft server, so don't feel bad if this is the point where you give up

There's many different ways to set up MongoDB, but I recommend one of these methods:

**Option 1: [MongoDB Atlas](https://cloud.mongodb.com/)**
- This is MongoDB's cloud service. It's by far the easiest to set up, but all the data is stored on their cloud, not yours. The free tier has a storage limit, but you won't go anywhere close to exceeding it.

**Option 2: Host it on a server**
- My personal choice, because I have one. If you have an Ubuntu server, [this tutorial](https://www.digitalocean.com/community/tutorials/how-to-install-mongodb-on-ubuntu-20-04) followed by [this one](https://www.digitalocean.com/community/tutorials/how-to-secure-mongodb-on-ubuntu-20-04) should be good. (if the `mongo` command doesn't work, use `mongosh`) 
- If you don't have an Ubuntu server, just google around and there will probably be a guide for your platform
- If you created a DB along with a username and password, you did it correctly
- I also recommend setting up [MongoDB compass](https://www.mongodb.com/products/tools/compass) so you have a GUI!

**Option 3: Host it on your computer**
- Probably not the wisest idea since it needs to be running 24/7. I would only do this if you're hosting the entire bot on it for some reason, or just want to test things out. But if that sounds like a plan to you, go follow this [absurdly long tutorial](https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-windows/).

All set? Awesome. Polaris uses two collections: `servers` for server data, and `auth` for website logins. I'm pretty sure the bot automatically creates these for you.

1. Find your **connection string**. The way you obtain it depends on how you set up MongoDB, but there will definitely be one. It should start with `mongodb://` or `mongodb+srv://` or something similar. **If you're self-hosting and can't find the string, you can skip this and just use the username + password you set up.**

2. Open up `.env` and paste in your database name as well as the connection string (MONGO_DB_URI in the file). If you don't want to use a connection string you can leave the value blank and provide the IP, username, and password instead.

3. Fire up the bot and check the console to see if it connected!
	- To double check, you can run /db with no arguments - if the bot responds (likely "No data!") it means you actually did it correctly!!! If not, cry

If it's not connecting, try checking:
- Is the database actually running?
- Did you paste the connection string incorrectly?
- Did you enter the correct database name into .env?
- Did you enter the right username and password?
  

### Step 4: Final steps
1. Deploy the bot's commands by running /deploy with the global argument set to true
2. If you have the web server enabled, it should be running on localhost. From there you can authorize your Discord account and change server settings
	- The web server uses a lot of resources but is also needed to modify advanced settings for the bot. It also contains the leaderboard page
	- If you're happy with your settings and only plan on using the bot for one server, you can disable the server in `config.json` and only enable it when you need to tweak things
		- Note that most simple settings (booleans and numbers) can be tweaked from /config
		- Reward roles and multipliers can be configured via /rewardrole and /multiplier
	- If you're running Polaris from a hosted server, make sure the port you chose is open. Then you should be able to visit `http://<server ip>:<port>`, e.g. http://7.7.7.7:6880. Make sure to also add it as an OAuth2 redirect in the Discord dev portal, ending in /auth. (e.g. http://7.7.7.7:6880/auth)
	- If you don't want the URL to be a shady looking IP, you're going to need to buy a domain then reverse proxy your localhost into an actual public URL. I wish you luck. (add that one as an OAuth2 redirect as well)
		- Just google "localhost to public URL" and you should get some info on how to do this
		- Alternatively, you can try [Cloudflare Tunnel](https://developers.cloudflare.com/pages/how-to/preview-with-cloudflare-tunnel/) or [ngrok](https://ngrok.com/) - though these are usually more temporary solutions

3. If you want the bot to be public, set that up in the Discord dev portal. But make sure you can handle it.
	- The bot should work fine until sharding kicks in (at ~2500 servers), then it might start to break down a little
	- Really, it comes down to your server specs and the number of members in a server
 
---

## Some other tips
### Transferring data from the original Polaris
**NOTE**: If you are listed as a bot developer, you can access the dashboard for any server your bot is in. The JSON import feature is heavily limited for non-devs (security reasons), so feel free to use this power in order to import .json files for others. 
1. On the [original Polaris dashboard](https://gdcolon.com/polaris), go to the Data tab of your server settings and press **Download all data**. This will download a .json file
2. On your own hosted dashboard, go to the Data tab of your server settings, scroll down, and scroll down to the import settings section
3. Upload the .json file and press import
4. All data from Polaris should be transferred!

### Using dev commands
`/db` allows you to view a server's raw data, or modify it
- e.g. `/db property:settings.multipliers` returns the data in `settings.multipliers`
- e.g. `/db property:users.123456.xp new_value:10` sets the user with ID 123456's XP to 10

`/setactivity`lets you change the bot's custom status, the args should walk you through it

`/setversion` updates the version number in /botstatus

`/deploy` deploys dev commands to the server, or the global commands everyone uses.
- There's also an option to undeploy the dev commands, but make sure at least one server has them or you'll need to dive into the code to get them back
- If this happens, open `index.js` and change `if (cmds.size < 1)` to `if (true)` in order to force-deploy the commands on the next startup

`/run` simply lets you evaluate js code, not much need for this unless you're adding new stuff and are familiar with discord.js

Devs can also view and modify any server from the web dashboard. The main use for this is importing from .json files, since only bot devs can do that (security reasons)

## Want to modify the bot?
Do whatever you want as long as you credit me and use your own fork for it.

* If you're hosting this publicly, credit me extra hard
* Do not add any paid or monetized features
* Issues and PRs on this repo are only for things that improve the open-source code, it's not a place for feature requests and new stuff as I'm no longer maintaining this bot

If you ever have any questions feel free to reach out to me, the Polaris support server is a good place for it

And if the code is bad, forgive me