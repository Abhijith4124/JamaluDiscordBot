const musicQueue = require('../utils/MusicQueues');
const playCommand = require('./play');
const messages = require('../messages/en_messages');
const errorEmbed = require('../embeds/errorEmbed.js');
const outputEmbed = require('../embeds/outputEmbed.js');
const config = require('../config.json');
const Authenticator = require('../utils/Authenticator');

module.exports = {
    name: "next",
    description: "Switches to the next Song",
    aliases: ['skip'],
    async execute(message, args) {
        if (musicQueue[message.member.guild.id]){
            if (!await Authenticator.Authenticate(message)){
                message.channel.send(errorEmbed.createErrorEmbed("You do not have sufficient permission")).then(sentMessage => {
                    setTimeout(() => {
                        sentMessage.delete();
                    }, config.messageDeleteDelay);
                });
                return;
            }
            if (musicQueue[message.member.guild.id].length-1 > musicQueue[message.member.guild.id]['playingIndex']){
                musicQueue[message.member.guild.id]['playingIndex'] = musicQueue[message.member.guild.id]['playingIndex'] + 1;
                playCommand.playMusic(message);
            }else {
                message.channel.send(outputEmbed.createOutputEmbed("Queue", `You have already reached the end of the queue`)).then(sentMessage => {
                    setTimeout(() => {
                        sentMessage.delete();
                    }, config.messageDeleteDelay);
                });
            }
        }else {
            message.channel.send(errorEmbed.createErrorEmbed(messages.NoSong)).then(sentMessage => {
                setTimeout(() => {
                    sentMessage.delete();
                }, config.messageDeleteDelay);
            });
        }
    }
}