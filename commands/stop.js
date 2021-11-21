const musicQueue = require('../utils/MusicQueues');
const playCommand = require('./play');
const messages = require('../messages/en_messages');
const errorEmbed = require('../embeds/errorEmbed.js');
const Authenticator = require('../utils/Authenticator');
const config = require('../config.json');

module.exports = {
    name: "stop",
    description: "Stops Music",
    aliases: ['dc', 's'],
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
            playCommand.resetPlayingEmbed(message);
            musicQueue[message.member.guild.id]['voiceChannel'].leave();
            musicQueue[message.member.guild.id] = null;
        }else {
            message.channel.send(errorEmbed.createErrorEmbed(messages.NoSong)).then(sentMessage => {
                setTimeout(() => {
                    sentMessage.delete();
                }, config.messageDeleteDelay);
            });
        }
    }
}