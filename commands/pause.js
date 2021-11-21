const musicQueue = require('../utils/MusicQueues');
const messages = require('../messages/en_messages');
const errorEmbed = require('../embeds/errorEmbed.js');
const Authenticator = require('../utils/Authenticator');
const config = require('../config.json');

module.exports = {
    name: "pause",
    description: "Pause the playing song",
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
            if (musicQueue[message.member.guild.id]['musicStatus'] === 'playing' && musicQueue[message.member.guild.id]['dispatcher']){
                musicQueue[message.member.guild.id]['dispatcher'].pause();
                musicQueue[message.member.guild.id]['musicStatus'] = 'paused';
            }else {
                message.channel.send(errorEmbed.createErrorEmbed(messages.NoSong)).then(sentMessage => {
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