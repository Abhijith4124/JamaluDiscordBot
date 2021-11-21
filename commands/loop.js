const musicQueue = require('../utils/MusicQueues');
const messages = require('../messages/en_messages');
const outputEmbed = require('../embeds/outputEmbed.js');
const errorEmbed = require('../embeds/errorEmbed.js');
const Authenticator = require('../utils/Authenticator');
const config = require('../config.json');

module.exports = {
    name: "loop",
    description: "Loops the playing Queue",
    aliases: ['l', 'lp'],
    async execute(message, args) {
        if (musicQueue[message.member.guild.id]){
            if (!await Authenticator.Authenticate(message)){
                message.reply(errorEmbed.createErrorEmbed("You do not have sufficient permission")).then(sentMessage => {
                    setTimeout(() => {
                        sentMessage.delete();
                    }, config.messageDeleteDelay);
                });
                return;
            }
            if (musicQueue[message.member.guild.id]['musicStatus'] === 'playing' && musicQueue[message.member.guild.id]['dispatcher']){
                if (musicQueue[message.member.guild.id]['loop']){
                    //Loop is enabled so disable it
                    musicQueue[message.member.guild.id]['loop'] = undefined;
                }else {
                    //Loop is not enabled so enabling it
                    musicQueue[message.member.guild.id]['loop'] = true;
                }
                message.channel.send(outputEmbed.createOutputEmbed("Looping", (musicQueue[message.member.guild.id]['loop']) ? 'Enabled' : 'Disabled')).then(sentMessage => {
                    setTimeout(() => {
                        sentMessage.delete();
                    }, config.messageDeleteDelay);
                });
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