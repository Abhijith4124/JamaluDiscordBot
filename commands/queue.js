const musicQueue = require('../utils/MusicQueues');
const Discord = require('discord.js');
const playCommand = require('./play');
const messages = require('../messages/en_messages');
const errorEmbed = require('../embeds/errorEmbed.js');
const outputEmbed = require('../embeds/outputEmbed.js');
const Authenticator = require('../utils/Authenticator');
const config = require('../config.json');

module.exports = {
    name: "queue",
    description: "Controls the Music Queue",
    aliases: ['q'],
    commands: [
        {
            command: 'queue',
            description: 'Returns the Queue List'
        },
        {
            command: 'clear',
            description: `Clears a Queue`
        }
    ],
    async execute(message, args) {
        if (args.length > 0){
            let command = args[0];
            if (command === 'clear') {
                if (musicQueue[message.member.guild.id]){
                    musicQueue[message.member.guild.id].length = 1;
                }
                message.channel.send(outputEmbed.createOutputEmbed("Queue Cleared", 'Queue has been Cleared')).then(sentMessage => {
                    setTimeout(() => {sentMessage.delete();}, config.messageDeleteDelay);
                })
            }
        }else {
            let MusicQueue = musicQueue[message.member.guild.id];
            if (MusicQueue) {
                let queueList = [[]];
                let queueI = 0;
                let i = 0;
                for (let music of MusicQueue) {
                    if (!queueList[i]){
                        queueList[i] = [];
                    }
                    if (queueList[i].length > 10){
                        i++;
                    }
                    queueList[i].push(music);
                }
                let MusicQueueEmbed = new Discord.MessageEmbed()
                    .setTitle("Music Queue")
                for (let queue of queueList[queueI]){
                    MusicQueueEmbed.addField(`${musicQueue[message.member.guild.id].indexOf(queue)}. ${queue.info.title}`, `Queued by <@${queue.owner}>`);
                }
                let queueMessage = await message.channel.send(MusicQueueEmbed);
                let reactions = ["⏮", "⏭"];
                reactions.forEach(reaction => queueMessage.react(reaction));
                const filter = (reaction, user) => {
                    return reactions.includes(reaction.emoji.name) && reaction.count > 1;
                };

                const collector = queueMessage.createReactionCollector(filter, {});
                collector.on('collect', (reaction, user) => {
                    reaction.users.remove(user);
                    if (reaction.emoji.name === reactions[0]) {
                        //Previous Button
                        if (queueI > 0){
                            queueI--;
                            let editedQueueEmbed = new Discord.MessageEmbed()
                                .setTitle("Music Queue")
                            queueList[queueI].forEach((queue, i) => {
                                editedQueueEmbed.addField(`${i}. ${ queue.info.title}`, `Queued by $<@${queue.owner}>`);
                            })
                            queueMessage.edit(editedQueueEmbed);
                        }else {

                        }
                    }

                    if (reaction.emoji.name === reactions[1]) {
                        //Next Button
                        if (queueI < queueList.length - 1) {
                            queueI++;
                            let editedQueueEmbed = new Discord.MessageEmbed()
                                .setTitle("Music Queue")
                            queueList[queueI].forEach((queue, i) => {
                                editedQueueEmbed.addField(`${i}. ${ queue.info.title}`, `Queued by $<@${queue.owner}>`);
                            })
                            queueMessage.edit(editedQueueEmbed);
                        }else {

                        }
                    }
                });
            }else {
                message.channel.send(errorEmbed.createErrorEmbed("No Queue Found"))
            }
        }
    }
}