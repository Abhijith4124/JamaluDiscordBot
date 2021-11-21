const Discord = require('discord.js');
const musicQueue = require('../utils/MusicQueues');

module.exports = {
    name: "stats",
    description: "Stops Music",
    private: true,
    async execute(message, args) {
        let isBotOwner = message.author.id === '313977600210894848';
        let client = args[0];
        if (!isBotOwner){
            return;
        }
        let playingGuilds = 0;
        let connectedVoiceChannels = 0;
        let listeners = 0;
        client.guilds.cache.forEach(guild => {
            if (musicQueue[guild.id]){
                playingGuilds++;
            }
        })
        client.voice.connections.forEach(e => {
            listeners = listeners + e.channel.members.size
            connectedVoiceChannels++
        });
        let embedMessage = new Discord.MessageEmbed()
            .setTitle("Jamalu Stats")
            .addField("Total Servers: ", client.guilds.cache.size)
            .addField("Active Queues: ", playingGuilds)
            .addField("Connected Voice Channels: ", connectedVoiceChannels)
            .addField("Listeners: ", listeners);

        message.channel.send(embedMessage);
    }
}