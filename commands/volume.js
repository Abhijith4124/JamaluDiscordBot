const musicQueue = require('../utils/MusicQueues');
const Discord = require('discord.js');
const Database = require('simplest.db');
const db = new Database({
    path: './database/main.json'
});
const outputEmbed = require('../embeds/outputEmbed.js');
const errorEmbed = require('../embeds/errorEmbed.js');
const config = require('../config.json');


module.exports = {
    name: "volume",
    description: "Change the Volume of the Music",
    aliases: ['v', 'vl'],
    async execute(message, args) {
        if (!message.member.roles.cache.find(r => r.name === "JamaluDJ") && !message.member.hasPermission("ADMINISTRATOR")){
            message.channel.send(errorEmbed.createErrorEmbed("You do not have sufficient permission")).then(sentMessage => {
                setTimeout(() => {
                    sentMessage.delete();
                }, config.messageDeleteDelay);
            });
            return;
        }
        if (args[0]) {
            let volume = args[0];
            if (volume <= 200) {
                db.set(`${message.member.guild.id}_Volume`, volume);
                if (musicQueue[message.member.guild.id] && musicQueue[message.member.guild.id]['dispatcher']) {
                    musicQueue[message.member.guild.id]['dispatcher'].setVolume(volume / 100);
                }
                let volumeEmbed = new Discord.MessageEmbed()
                    .setTitle(`Volume`)
                    .setDescription(`Changed Volume to ${volume}%`)
                message.channel.send(volumeEmbed);
            } else {
                let volumeEmbed = new Discord.MessageEmbed()
                    .setTitle(`Volume`)
                    .setDescription(`Volume cannot be more than 200%`)
                message.channel.send(volumeEmbed).then(sentMessage => {
                    setTimeout(() => {
                        sentMessage.delete();
                    }, config.messageDeleteDelay);
                });
            }
        } else {
            let volume = (db.get(`${message.member.guild.id}_Volume`) !== undefined) ? db.get(`${message.member.guild.id}_Volume`) : 100;
            message.channel.send(outputEmbed.createOutputEmbed("Volume", `Current Volume: ${volume}`)).then(sentMessage => {
                setTimeout(() => {
                    sentMessage.delete();
                }, config.messageDeleteDelay);
            });
        }
    }
}