const Discord = require('discord.js');
const fs = require('fs');
const musicQueue = require('../utils/MusicQueues')

module.exports = {
    name: "maintenance",
    description: "Enable Maintenance Mode for Jamalu",
    private: true,
    async execute(message, args) {
        let isBotOwner = message.author.id === '313977600210894848';
        let client = args[0];
        if (!isBotOwner){
            return;
        }
        client.guilds.cache.forEach(guild => {
            if (musicQueue[guild.id]){
                if (musicQueue[guild.id]['playMenu']){
                    musicQueue[guild.id]['playMenu'].delete();
                    musicQueue[guild.id]['playMenu'] = null;
                    musicQueue[guild.id] = null;
                }
            }
        })
        client.voice.connections.forEach(e => {
            e.disconnect();
        });

        message.channel.send('Maintenance Mode Started');
    }
}