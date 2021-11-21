const ytdl = require('ytdl-core');
const discordYtdl = require('discord-ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const musicQueue = require('../utils/MusicQueues')
const Discord = require('discord.js');
const createBar = require('string-progressbar');
const PlaylistSummary = require('youtube-playlist-summary');
const yts = require('yt-search');
const spotifyUrlInfo = require("spotify-url-info");
const Database = require('simplest.db');
const db = new Database({
    path: './database/main.json'
});
const Meta = require('html-metadata-parser');
const messages = require('../messages/en_messages');
const errorEmbed = require('../embeds/errorEmbed.js');
const outputEmbed = require('../embeds/outputEmbed.js');
const Authenticator = require('../utils/Authenticator');
const config = require('../config.json');

async function processMusic(url, type, message) {
    if (!musicQueue[message.member.guild.id]) {
        //First Time Playing a Song so initializing some things here to avoid undefined error.
        musicQueue[message.member.guild.id] = [];
        musicQueue[message.member.guild.id]['playingIndex'] = 0;
        musicQueue[message.member.guild.id]['seekTime'] = 0;
        musicQueue[message.member.guild.id]['filter'] = null;
        //Joining the Voice Channel because its the first time.
        if (type === 'youtube') {
            musicQueue[message.member.guild.id].push(
                {
                    owner: message.member.user.id,
                    info: {
                        url: url,
                        type: type
                    }
                });
            await playMusic(message);
        }
    } else {
        if (type === 'youtube') {
            let videoMeta = await Meta.parser(url);
            let musicName = videoMeta.meta.title;
            musicQueue[message.member.guild.id].push(
                {
                    owner: message.member.user.id,
                    info: {
                        title: musicName,
                        url: url,
                        type: type
                    }
                });
            let queuedEmbed = new Discord.MessageEmbed()
                .setTitle(`Queued ${musicName}`)
                .addField(`Queue Index`, `${musicQueue[message.member.guild.id].length}`)
                .addField(`Queued By`, `@${message.member.user.username}`)
                .setURL(url)
            message.channel.send(queuedEmbed);
        }
    }
}

async function queueMusic(musicData, message){
    //Just adding to the queue. No need to join or initialize anything
    if (musicData.type === 'youtube') {
        musicQueue[message.member.guild.id].push(
            {
                owner: message.member.user.id,
                info: {
                    title: musicData.title,
                    url: musicData.url,
                    type: musicData.type
                }
            });
    }
}

async function playMusic(message) {
    let voiceChannel = (musicQueue[message.member.guild.id]['voiceChannel']) ? musicQueue[message.member.guild.id]['voiceChannel'] : message.member.voice.channel;
    if (!voiceChannel) {
        message.channel.send(errorEmbed.createErrorEmbed("Join any Voice Channel first")).then(sentMessage => {
            setTimeout(() => {
                sentMessage.delete();
            }, config.messageDeleteDelay);
        });
        return;
    }
    let voiceConnection = await voiceChannel.join();
    if (!voiceConnection){
        errorEmbed.createErrorEmbed("Could not join the Voice Channel");
        musicQueue[message.member.guild.id] = null;
        return;
    }
    voiceConnection.voice.setSelfDeaf(true);
    musicQueue[message.member.guild.id]['voiceConnection'] = voiceConnection;
    musicQueue[message.member.guild.id]['voiceChannel'] = voiceChannel;

    let volume = 100;
    if (db.get(`${message.member.guild.id}_Volume`) !== undefined) {
        volume = db.get(`${message.member.guild.id}_Volume`);
    }

    let currentMusicQueue = musicQueue[message.member.guild.id][musicQueue[message.member.guild.id]['playingIndex']];
    let info = await ytdl.getBasicInfo(currentMusicQueue.info.url);
    let videoInfo = {
        title: info.videoDetails.title,
        author: info.videoDetails.author,
        song: info.videoDetails.media.song,
        length: info.videoDetails.lengthSeconds,
        live: info.videoDetails.isLiveContent,
        url: info.videoDetails.video_url,
        type: currentMusicQueue.info.type
    }

    musicQueue[message.member.guild.id][musicQueue[message.member.guild.id]['playingIndex']].info = videoInfo;

    if (!videoInfo){
        errorOccurred(message);
        return;
    }

    if (videoInfo.type === 'youtube') {
        if(videoInfo.live) {
            if (musicQueue[message.member.guild.id]['filter']){
                musicQueue[message.member.guild.id]['streamConfig'] = {
                    quality: [128, 127, 120, 96, 95, 94, 93], highWaterMark: 1024 * 1024 * 10,
                    encoderArgs: ['-af', ...musicQueue[message.member.guild.id]['filter']], opusEncoded: true}
            }else {
                musicQueue[message.member.guild.id]['streamConfig'] = {
                    quality: [128, 127, 120, 96, 95, 94, 93], highWaterMark: 1024 * 1024 * 10, opusEncoded: true}
            }
        }else {
            if (musicQueue[message.member.guild.id]['filter']){
                musicQueue[message.member.guild.id]['streamConfig'] = {filter: "audioonly",
                    quality: "highestaudio",
                    opusEncoded: true,
                    encoderArgs: ['-af', ...musicQueue[message.member.guild.id]['filter']],
                    highWaterMark: 1024 * 1024 * 10}
            }else {
                musicQueue[message.member.guild.id]['streamConfig'] = {filter: "audioonly",
                    quality: "highestaudio",
                    opusEncoded: true,
                    highWaterMark: 1024 * 1024 * 10}
            }
        }
        
        try {
            musicQueue[message.member.guild.id]['stream'] = discordYtdl(videoInfo.url, musicQueue[message.member.guild.id]['streamConfig']);
            musicQueue[message.member.guild.id]['dispatcher'] = musicQueue[message.member.guild.id]['voiceConnection']
                .play(musicQueue[message.member.guild.id]['stream'], {bitrate: 384, volume: volume / 100, type: 'opus'});

            musicQueue[message.member.guild.id]['musicStatus'] = 'playing';
        }catch (e) {
            console.error(e);
            errorOccurred(message);
        }
    }

    let playingEmbed = new Discord.MessageEmbed()
        .setTitle(videoInfo.title.toString())
        .addField(createBar(videoInfo.length, 1, 10)[0],
            `${new Date(1 * 1000).toISOString().substr(11, 8)}/${new Date(videoInfo.length * 1000).toISOString().substr(11, 8)} ${(videoInfo.live) ? '🔴LIVE' : ''}`)
        .addField(`Played by`, `<@${currentMusicQueue.owner}>`)
        .setURL(videoInfo.url);

    let sentMessage = await message.channel.send(playingEmbed);

    let reactions = ["⏮", "⏯️", "⏭"];
    for (let reaction of reactions){
        await sentMessage.react(reaction);
    }

    const filter = (reaction, user) => {
        return reactions.includes(reaction.emoji.name) && reaction.count > 1;
    };

    const collector = sentMessage.createReactionCollector(filter, {});
    collector.on('collect', (reaction, user) => {
        reaction.users.remove(user);

        if (reaction.emoji.name === reactions[0]) {
            //Previous Button
            if (user.id === currentMusicQueue.owner) {
                let previousCommand = require('./previous');
                previousCommand.execute(message, null);
            } else {
                message.channel.send(errorEmbed.createErrorEmbed("You do not have sufficient permission")).then(sentMessage => {
                    setTimeout(() => {
                        sentMessage.delete()
                    }, config.messageDeleteDelay)
                });
            }
        }

        if (reaction.emoji.name === reactions[1]) {
            //Play/Pause
            if (musicQueue[message.member.guild.id]) {
                if (musicQueue[message.member.guild.id]['musicStatus'] === 'paused' && musicQueue[message.member.guild.id]['dispatcher']) {
                    if (user.id === currentMusicQueue.owner) {
                        let resumeCommand = require('./resume');
                        resumeCommand.execute(message, null)
                    } else {
                        message.channel.send(errorEmbed.createErrorEmbed("You do not have sufficient permission")).then(sentMessage => {
                            setTimeout(() => {
                                sentMessage.delete()
                            }, config.messageDeleteDelay)
                        });
                    }
                } else if (musicQueue[message.member.guild.id]['musicStatus'] === 'playing' && musicQueue[message.member.guild.id]['dispatcher']) {
                    if (user.id === currentMusicQueue.owner) {
                        let pauseCommand = require('./pause');
                        pauseCommand.execute(message, null)
                    } else {
                        message.channel.send(errorEmbed.createErrorEmbed("You do not have sufficient permission")).then(sentMessage => {
                            setTimeout(() => {
                                sentMessage.delete()
                            }, config.messageDeleteDelay)
                        });
                    }
                }
            } else {
                message.channel.send(errorEmbed.createErrorEmbed(messages.NoSong)).then(sentMessage => {
                    setTimeout(() => {
                        sentMessage.delete();
                    }, config.messageDeleteDelay);
                });
            }
        }
        if (reaction.emoji.name === reactions[2]) {
            //Next Button
            if (user.id === currentMusicQueue.owner) {
                let nextCommand = require('./next');
                nextCommand.execute(message, null)
            } else {
                message.channel.send(errorEmbed.createErrorEmbed("You do not have sufficient permission")).then(sentMessage => {
                    setTimeout(() => {
                        sentMessage.delete()
                    }, config.messageDeleteDelay)
                });
            }
        }
    });

    resetPlayingEmbed(message);

    musicQueue[message.member.guild.id]['playMenu'] = sentMessage;

    function updatePlayMenu() {
        if (musicQueue[message.member.guild.id]['musicStatus']  === 'playing' && musicQueue[message.member.guild.id]['playMenu']){
            let playingEmbed = new Discord.MessageEmbed()
                .setTitle(videoInfo.title.toString())
                .addField(createBar((!videoInfo.length) ? 1 : videoInfo.length,
                    (musicQueue[message.member.guild.id]['dispatcher'].streamTime + musicQueue[message.member.guild.id]['seekTime']) / 1000 + 1, 10)[0],
                    `${new Date((musicQueue[message.member.guild.id]['dispatcher'].streamTime + musicQueue[message.member.guild.id]['seekTime'])).toISOString().substr(11, 8)}/${new Date(videoInfo.length * 1000).toISOString().substr(11, 8)} ${(videoInfo.live) ? '🔴LIVE' : ''}`)
                .addField(`Played by`, `<@${currentMusicQueue.owner}>`)
                .setURL(videoInfo.url);
            musicQueue[message.member.guild.id]['playMenu'].edit(playingEmbed).catch((error) => {
                console.error(error)
                resetPlayingEmbed(message);
            })
        }

        if ((musicQueue[message.member.guild.id]['dispatcher'].streamTime + musicQueue[message.member.guild.id]['seekTime']) > videoInfo.length * 1000 && !videoInfo.live) {
            //Checks if it finished playing and clears the progress
            resetPlayingEmbed(message);
        }
    }

    //Calls the Update Play Menu for the first time to initialize it if the Video is not live
    musicQueue[message.member.guild.id]['progressUpdate'] = setInterval(updatePlayMenu, 2000);

    attachDispatcherFinish(message)
}

function attachDispatcherFinish(message) {
    musicQueue[message.member.guild.id]['dispatcher'].on('finish', () => {
        if (musicQueue[message.member.guild.id]['playingIndex'] < musicQueue[message.member.guild.id].length - 1) {
            musicQueue[message.member.guild.id]['playingIndex'] = musicQueue[message.member.guild.id]['playingIndex'] + 1;
            playMusic(message);
        } else {
            //Finished Playing the Queue so check if loop is on and replay
            if (musicQueue[message.member.guild.id]['loop']) {
                musicQueue[message.member.guild.id]['playingIndex'] = 0;
                playMusic(message);
            } else {
                resetPlayingEmbed(message);
                musicQueue[message.member.guild.id]['dispatcher'].destroy();
                musicQueue[message.member.guild.id]['voiceChannel'].leave();
                musicQueue[message.member.guild.id] = null;
            }
        }
    })
}

function errorOccurred(message){
    message.channel.send(errorEmbed.createErrorEmbed(`Failed to Play the Song.`)).then(sentMessage => {
        setTimeout(() => {
            sentMessage.delete();
        }, config.messageDeleteDelay);
    });
    musicQueue[message.member.guild.id]['voiceChannel'].leave();
    musicQueue[message.member.guild.id] = null;
}

function resetPlayingEmbed(message) {
    if (musicQueue[message.member.guild.id]['playMenu']) {
        musicQueue[message.member.guild.id]['playMenu'].delete();
        musicQueue[message.member.guild.id]['playMenu'] = null;
    }
    if (musicQueue[message.member.guild.id]['deleteTimeout']) {
        clearTimeout(musicQueue[message.member.guild.id]['deleteTimeout'])
        musicQueue[message.member.guild.id]['deleteTimeout'] = null;
    }
    if (musicQueue[message.member.guild.id]['progressUpdate']) {
        clearInterval(musicQueue[message.member.guild.id]['progressUpdate']);
        musicQueue[message.member.guild.id]['progressUpdate'] = null;
    }
}

function getYoutubePlaylistId(url) {
    let VID_REGEX = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
    let regPlaylist = /[?&]list=([^#\&\?]+)/;
    let match = url.match(regPlaylist);
    return match[1];
}

module.exports = {
    name: "play",
    description: "Plays Music",
    aliases: ['p', 'add'],
    async execute(message, args) {
        let input = args.join(" ");
        if (!input.trim()){
            let playingEmbed = new Discord.MessageEmbed()
                .setTitle("No Result Found")
                .setDescription("Failed to find the song you are searching for");
            message.channel.send(playingEmbed).then(sentMessage => {
                setTimeout(() => {
                    sentMessage.delete();
                }, config.messageDeleteDelay);
            });
            return;
        }
        if (/http(?:s?):\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-\_]*)(&(amp;)?‌​[\w\?‌​=]*)?/.test(input)) {
            //It should be a direct url
            let url = args[0];
            processMusic(url, 'youtube', message);
        } else if (/(?:https?:\/\/)?(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/(?:playlist|list|embed)(?:\.php)?(?:\?.*list=|\/))([a-zA-Z0-9\-_]+)/.test(input)) {
            //If its a playlist
            let playlistId = getYoutubePlaylistId(input);
            const config = {
                GOOGLE_API_KEY: process.env.GOOGLE_API_KEY, // require
                PLAYLIST_ITEM_KEY: ['title', 'videoUrl'] // option
            }
            const playlistSummary = new PlaylistSummary(config);
            let result = await playlistSummary.getPlaylistItems(playlistId)
            let playlistMusics = result.items;
            await processMusic(playlistMusics[0].videoUrl, 'youtube', message, true);
            message.channel.send( outputEmbed.createOutputEmbed("Jamalu", `Queued ${playlistMusics.length} Songs`));
            playlistMusics.shift();
            for (let music of playlistMusics) {
                await queueMusic({title: music.title, url: music.videoUrl, type: 'youtube'}, message);
            }
        } else if (input.includes("spotify") && input.includes("track")){
            //Spotify Track
            let song = await spotifyUrlInfo.getPreview(input);
            let searchResult = await yts(`${song.title} ${song.artist}`);
            const resultVideo = searchResult.videos[0];
            let url = resultVideo.url;
            processMusic(url, 'youtube', message);
        } else if (input.includes("spotify") && input.includes("playlist")){
            //Spotify Playlist
            let songs = await spotifyUrlInfo.getTracks(input);
            let result = await yts(`${songs[0].name} ${songs[0].artists[0].name}`);
            const resultVideo = result.videos[0];
            let url = resultVideo.url;

            await processMusic(url, 'youtube', message, true);
            songs.shift();
            message.channel.send(outputEmbed.createOutputEmbed("Jamalu", `Queued ${songs.length} Songs`));

            for (let song of songs) {
                let result = await yts(`${song.name} ${song.artists[0].name}`);
                const resultVideo = result.videos[0];
                let url = resultVideo.url;
                await queueMusic({title: song.name, url: url, type: 'youtube'}, message);
            }
        } else if (!/http(?:s?):\/\/(?:www\.)?youtu(?:be\.com)/.test(input)) {
            //It is not a Youtube link so getting link here
            let searchResult =  await yts(input);
            const resultVideo = searchResult.videos[0];
            let url = resultVideo.url;
            processMusic(url, 'youtube', message);
        }
        else {
            let playingEmbed = new Discord.MessageEmbed()
                .setTitle("No Result Found")
                .setDescription("Failed to find the song you are searching for");
            message.channel.send(playingEmbed).then(sentMessage => {
                setTimeout(() => {
                    sentMessage.delete();
                }, config.messageDeleteDelay);
            });
        }
    },
    playMusic(message) {
        playMusic(message);
    },
    resetPlayingEmbed(message) {
        resetPlayingEmbed(message);
    },
    attachDispatcherFinish(message){
        attachDispatcherFinish(message)
    }
}