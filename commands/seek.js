const musicQueue = require('../utils/MusicQueues');
const playCommand = require('./play');
const messages = require('../messages/en_messages');
const errorEmbed = require('../embeds/errorEmbed.js');
const outputEmbed = require('../embeds/outputEmbed.js');
const config = require('../config.json');
const Authenticator = require('../utils/Authenticator');
const ytdl = require('ytdl-core');
const Database = require('simplest.db');
const db = new Database({
    path: './database/main.json'
});

module.exports = {
    name: "seek",
    description: "Seeks to the Specified TimeStamp",
    aliases: ['sk', 'moveto'],
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

            let seekInput = args[0];
            if (seekInput) {
                let timeStamps = seekInput.split(".").reverse();
                let hours, minutes, seconds;
                let timeToSeek = 0;
                for (const time of timeStamps) {
                    if (seconds === undefined){
                        seconds = time * 1000;
                        timeToSeek = timeToSeek + seconds;
                        continue;
                    }
                    if (minutes === undefined){
                        minutes = time * 60000
                        timeToSeek = timeToSeek + minutes;
                        continue;
                    }
                    if (hours === undefined){
                        hours = time * 3600000
                        timeToSeek = timeToSeek + hours;
                    }
                }
                let currentMusicQueue = musicQueue[message.member.guild.id][musicQueue[message.member.guild.id]['playingIndex']];
                let videoInfo = currentMusicQueue.info;
                if (timeToSeek < videoInfo.length * 1000){
                    let volume = 100;
                    if (db.get(`${message.member.guild.id}_Volume`) !== undefined) {
                        volume = db.get(`${message.member.guild.id}_Volume`);
                    }
                    if (videoInfo.type === 'youtube') {
                        musicQueue[message.member.guild.id]['dispatcher'] = musicQueue[message.member.guild.id]['voiceConnection']
                            .play(musicQueue[message.member.guild.id]['stream'], {bitrate: 384, volume: volume / 100, seek: timeToSeek / 1000});
                        musicQueue[message.member.guild.id]['seekTime'] = timeToSeek;

                        playCommand.attachDispatcherFinish(message);
                    }
                }else {
                    message.channel.send(errorEmbed.createErrorEmbed("Invalid TimeStamp To Seek")).then(sentMessage => {
                        setTimeout(() => {
                            sentMessage.delete();
                        }, config.messageDeleteDelay);
                    });
                }
            }else {
                message.channel.send(errorEmbed.createErrorEmbed("Please Provide a Valid TimeStamp To Seek")).then(sentMessage => {
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