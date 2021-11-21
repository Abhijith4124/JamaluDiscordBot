const musicQueue = require('../utils/MusicQueues');
const Discord = require('discord.js');
const Genius = require("genius-lyrics");
const Client = new Genius.Client("V0QvaJVNjHmZLizIIybgs95f3VCEGx7TcoOrCDGtj7IyoE0BmasHyDpAbSKbZG4Q");
const ytdl = require('ytdl-core');
const messages = require('../messages/en_messages');
const errorEmbed = require('../embeds/errorEmbed.js');
const config = require('../config.json');

function getLyrics(songName, callback) {
    console.log(`Searching for Song Lyrics ${songName}`)
    try {
        const axios = require('axios');

        let config = {
            method: 'get',
            url: `https://api.ksoft.si/lyrics/search?q=${songName}`,
            headers: {
                'Authorization': process.env.KSOFT_AUTH
            }
        };

        axios(config)
            .then(function (response) {
                callback({status: 'success', lyrics : response.data.data[0].lyrics})
                console.log(JSON.stringify(response.data.data[0].lyrics));
            })
            .catch(function (error) {
                callback({status: 'failed', lyrics : ""})
                console.error(error);
            });
    }catch (e) {
        console.error(e)
        callback({status: 'failed', lyrics : ''})
    }
}

module.exports = {
    name: "lyrics",
    description: "Returns the lyrics of the current playing song",
    aliases: ['ly'],
    async execute(message, args) {
        if (musicQueue[message.member.guild.id]) {
            let currentPlayingSong = musicQueue[message.member.guild.id][musicQueue[message.member.guild.id]['playingIndex']];
            let searchQuery;
            ytdl.getBasicInfo(currentPlayingSong.info.url).then((info) => {
                let searchingEmbed;
                if (info.videoDetails.media.song){
                    let songName = `${info.videoDetails.media.song.replace(/[(-)]/g, "")}`;
                    searchingEmbed = new Discord.MessageEmbed().setTitle(`Searching Lyrics...`).setDescription(`Searching Lyrics for ${songName}`);
                }else {
                    searchingEmbed = new Discord.MessageEmbed().setTitle(`Searching Lyrics...`).setDescription(`Searching for Song Lyrics`);
                }

                message.channel.send(searchingEmbed).then((sentMessage) => {
                    getLyrics(info.videoDetails.title, (data) => {
                        if (data.status === 'success'){
                            message.channel.send(data.lyrics, { split: true })
                            sentMessage.delete();
                        }else {
                            message.channel.send("Failed to get Lyrics").then(sentMessage => {
                                setTimeout(() => {
                                    sentMessage.delete();
                                }, config.messageDeleteDelay);
                            });
                            sentMessage.delete();
                        }
                    })
                })
            });
        }else {
            message.channel.send(errorEmbed.createErrorEmbed(messages.NoSong)).then(sentMessage => {
                setTimeout(() => {
                    sentMessage.delete();
                }, config.messageDeleteDelay);
            });
        }
    }
}