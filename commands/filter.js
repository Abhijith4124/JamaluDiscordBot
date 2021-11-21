const musicQueue = require('../utils/MusicQueues');

const Database = require('simplest.db');

const db = new Database({
    path: './database/main.json'
});

const playCommand = require('./play');

const discordYtdl = require('discord-ytdl-core');

const outputEmbed = require('../embeds/outputEmbed.js');

const config = require('../config.json');

module.exports = {
    name: "filter",
    description: "Add Filters to the Song. Available Filters : bass, 8d, vapourwave, nightcore, " +
        "phaser, tremolo, vibrato, surround, pulsator, subboost, chorus, karaoke, sofa, desilencer",
    aliases: ['f'],
    async execute(message, args) {
        if (!musicQueue[message.member.guild.id]){
            sendMessage(message, "No Song is being Played");
            return;
        }
        if (!args[0]){
            sendMessage(message, "Please Specify a Filter. For more info use the help command");
            return;
        }
        if (!musicQueue[message.member.guild.id]['filter'] || musicQueue[message.member.guild.id]['filter'].includes('dynaudnorm=f=200')){
            musicQueue[message.member.guild.id]['filter'] = [];
        }
        const filters = [
            'bass=g=20,dynaudnorm=f=200',//bassboost 0
            'apulsator=hz=0.08', //8D 1
            'aresample=48000,asetrate=48000*0.8',//vaporwave 2
            'aresample=48000,asetrate=48000*1.25',//nightcore 3
            'aphaser=in_gain=0.4',//phaser 4
            'tremolo',//tremolo 5
            'vibrato=f=6.5',//vibrato 6
            'surround',//surrounding 7
            'apulsator=hz=1',//pulsator 8
            'asubboost',//subboost 9
            'chorus=0.5:0.9:50|60|40:0.4|0.32|0.3:0.25|0.4|0.3:2|2.3|1.3',//chorus of 3 10
            'stereotools=mlev=0.015625',//karaoke 11
            'sofalizer=sofa=/path/to/ClubFritz12.sofa:type=freq:radius=2:rotation=5',//sofa 12
            'silenceremove=window=0:detection=peak:stop_mode=all:start_mode=all:stop_periods=-1:stop_threshold=0',//desilencer 13
            "remove",
        ];
        switch (args[0].toLowerCase()) {
            case 'bass' || 'bassboost':
                musicQueue[message.member.guild.id]['filter'].push(filters[0]);
                sendMessage(message, "Enabled BassBoost Filter");
                updateStream(message);
                break;
            case '8d':
                musicQueue[message.member.guild.id]['filter'].push(filters[1]);
                sendMessage(message, "Enabled 8D Filter");
                updateStream(message);
                break;
            case 'vapor' || 'vapourwave':
                musicQueue[message.member.guild.id]['filter'].push(filters[2]);
                sendMessage(message, "Enabled VapourWave Filter");
                updateStream(message);
                break;
            case 'nightcore':
                musicQueue[message.member.guild.id]['filter'].push(filters[3]);
                sendMessage(message, "Enabled NightCore Filter");
                updateStream(message);
                break;
            case 'phaser':
                musicQueue[message.member.guild.id]['filter'].push(filters[4]);
                sendMessage(message, "Enabled Phaser Filter");
                updateStream(message);
                break;
            case 'tremolo':
                musicQueue[message.member.guild.id]['filter'].push(filters[5]);
                sendMessage(message, "Enabled Tremolo Filter");
                updateStream(message);
                break;
            case 'vibrato':
                musicQueue[message.member.guild.id]['filter'].push(filters[6]);
                sendMessage(message, "Enabled Vibrato Filter");
                updateStream(message);
                break;
            case 'pulsator':
                musicQueue[message.member.guild.id]['filter'].push(filters[8]);
                sendMessage(message, "Enabled Pulsator Filter");
                updateStream(message);
                break;
            case 'chorus':
                musicQueue[message.member.guild.id]['filter'].push(filters[10]);
                sendMessage(message, "Enabled Chorus Filter");
                updateStream(message);
                break;
            case 'karaoke':
                musicQueue[message.member.guild.id]['filter'].push(filters[11]);
                sendMessage(message, "Enabled Karaoke Filter");
                updateStream(message);
                break;
            case 'sofa':
                musicQueue[message.member.guild.id]['filter'].push(filters[12]);
                sendMessage(message, "Enabled Karaoke Filter");
                updateStream(message);
                break;
            case 'desilencer' || 'silence' || 'silencer' || 'denoise':
                musicQueue[message.member.guild.id]['filter'].push(filters[13]);
                sendMessage(message, "Enabled DeSilencer Filter");
                updateStream(message);
                break;
            case 'clear' || 'remove':
                musicQueue[message.member.guild.id]['filter'] = null;
                sendMessage(message, "Cleared All Filters");
                updateStream(message);
                break;
            default:
                sendMessage(message,'Unknown Filter');
        }
    }
}

function sendMessage(message, text) {
    message.reply(outputEmbed.createOutputEmbed('Filter',text)).then(sentMessage => {
        setTimeout(() => {
            sentMessage.delete();
        }, config.messageDeleteDelay);
    });
}

function updateStream(message) {
    try {
        let volume = 100;
        if (db.get(`${message.member.guild.id}_Volume`) !== undefined) {
            volume = db.get(`${message.member.guild.id}_Volume`);
        }
        if (musicQueue[message.member.guild.id]['filter']){
            musicQueue[message.member.guild.id]['streamConfig'].encoderArgs = ['-af', ...musicQueue[message.member.guild.id]['filter']]
        }else {
            delete musicQueue[message.member.guild.id]['streamConfig'].encoderArgs
        }
        musicQueue[message.member.guild.id]['stream'] = discordYtdl(
            musicQueue[message.member.guild.id][musicQueue[message.member.guild.id]['playingIndex']].info.url, musicQueue[message.member.guild.id]['streamConfig']);
        musicQueue[message.member.guild.id]['dispatcher'] = musicQueue[message.member.guild.id]['voiceConnection']
            .play(musicQueue[message.member.guild.id]['stream'], {bitrate: 384, volume: volume / 100, type: 'opus'})
        playCommand.attachDispatcherFinish(message);
    }catch (e){
        sendMessage(message,'Failed to Apply Filter');
    }
}