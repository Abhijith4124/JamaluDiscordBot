require('dotenv').config();

const Discord = require('discord.js');

const { Client, Intents, Collection } = require('discord.js');

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

const config = require('./config.json');

const fs = require('fs');

const musicQueue = require('./utils/MusicQueues');

const Database = require('simplest.db');

const db = new Database({
    path: './database/main.json'
});

const clientRequiredCommands = ['ping', 'maintenance', 'stats']

client.commands = new Collection();

if (!fs.existsSync(config.themeSongDir)){
    fs.mkdirSync(config.themeSongDir);
}

client.once('ready', () => {
    console.log('Ready!');
    client.user.setActivity(`${config.prefix}help`, {type: "LISTENING"});
});

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);

    // set a new item in the Collection
    // with the key as the command name and the value as the exported module
    client.commands.set(command.name, command);
    if (command.aliases){
        for (let alias of command.aliases) {
            client.commands.set(alias, command);
        }
    }
}

client.on('message', message => {
    try {
        if (message.author.bot || !message.guild) return;

        let prefix = (db.get(`${message.guild.id}_Prefix`) !== undefined) ? db.get(`${message.guild.id}_Prefix`) : config.prefix;

        if (!message.content.startsWith(prefix)) return;

        const args = message.content.slice(prefix.length).trim().split(/ +/);

        const command = args.shift().toLowerCase();

        if (clientRequiredCommands.includes(command)){
            args[0] = client;
        }

        if (!client.commands.has(command)) return;

        client.commands.get(command).execute(message, args);

        if (db.get(`${message.guild.id}_prune`)){
            setTimeout(() => {
                message.delete();
            }, db.get(`${message.guild.id}_prune`) * 1000);
        }
    } catch (error) {
        console.error(error);
        message.reply('there was an error trying to execute that command!');
    }
});

let timeout;

client.on('voiceStateUpdate', (voiceState, voiceState1) => {
    if (!musicQueue[voiceState1.member.guild.id] && db.get(`${voiceState1.guild.id}_themeEnabled`)){
        if (!voiceState.channel && voiceState1.channel){
            //User Joined
            let voiceChannel = voiceState1.channel;
            if (voiceChannel){
                let userId = voiceState1.member.user.id
                let fileName = `${voiceState1.guild.id}_${userId}`;
                if (fs.existsSync(`./${config.themeSongDir}/${fileName}`)){
                    try {
                        clearTimeout(timeout);
                        timeout = undefined;
                        voiceChannel.join().then((voiceConnection) => {
                            const broadcast = client.voice.createBroadcast();
                            broadcast.play(`./${config.themeSongDir}/${fileName}`, {bitrate: "auto"});
                            voiceConnection.play(broadcast)
                            timeout = setTimeout(() => {
                                voiceChannel.leave();
                            }, 10 * 1000)
                        })
                    }catch (e) {
                        console.error(`ERROR OCCURRED: ${e}`);
                    }
                }
            }
        }
    }
});

//Dev Token Nzc4MTI3MjQ5MjAzMTM0NDY0.X7NdeQ.iLo4vRcBCTTIC0VXZBerIsPyLR8
client.login(process.env.DISCORD_TOKEN);