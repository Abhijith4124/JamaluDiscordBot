const download = require('download-file');
const ffmpeg = require('ffmpeg');
const fs = require('fs');
const ytdl = require('ytdl-core');
const Database = require('simplest.db');
const db = new Database({
    path: './database/main.json'
});
const outputEmbed = require('../embeds/outputEmbed.js');

const config = require('../config.json');

module.exports = {
    name: 'theme',
    description: 'Set Theme Song for the User which plays when then user joins',
    commands: [
        {
            command: 'link',
            description: 'Link a Theme Song to the User'
        },
        {
            command: 'unlink',
            description: `Unlink a User's Theme Song`
        },
        {
            command: 'on',
            description: 'Turns On Theme Song for the Server'
        },
        {
            command: 'off',
            description: 'Turns Off Theme Song for the Server'
        },
    ],
    async execute(message, args) {
        let method = args[0];

        let url = args[1];

        if (method === "on"){
            message.channel.send(outputEmbed.createOutputEmbed("Theme Song", "Enabled"))
            db.set(`${message.guild.id}_themeEnabled`, true);
            return;
        }
        if (method === "off"){
            message.channel.send(outputEmbed.createOutputEmbed("Theme Song", "Disabled"))
            db.set(`${message.guild.id}_themeEnabled`, false);
            return;
        }
        if (!db.get(`${message.guild.id}_themeEnabled`)){
            message.channel.send(outputEmbed.createOutputEmbed("Theme Song", "Theme Song is Disabled in this Server")).then(sentMessage => {
                setTimeout(() => {
                    sentMessage.delete();
                }, config.messageDeleteDelay);
            });
            return;
        }
        if (method === "link") {
            let userId;
            let username;
            if (message.mentions.users.toJSON()[0]){
                //User Mentioned. Checking if Admin
                if (message.member.hasPermission("ADMINISTRATOR")){
                    userId = message.mentions.users.toJSON()[0].id;
                    username = message.mentions.users.toJSON()[0].username;
                }else {
                    message.reply(`Only an Admin can Link Song to Other Users`);
                    return;
                }
            }else {
                userId = message.member.user.id;
                username = message.member.user.username;
            }

            //TODO: Remove Attachment Support or Request bot to be mentioned in the message
            if (message.attachments.size > 0){
                //If the User sends the file as an attachment
                let attachment = message.attachments.toJSON()[0];

                let fileName = `${message.guild.id}_${userId}`;
                let options = {
                    directory: `./${config.themeSongDir}/`,
                    filename: fileName
                }

                download(attachment.url, options, (error) => {
                    if (error){
                        console.error(error);
                        message.reply(`Failed to Link Theme Song to ${username}.`);
                    }else {
                        //Adding to Database
                        if (attachment.name.includes(".mp4")) {
                            try {
                                let process = new ffmpeg(`./${config.themeSongDir}/${fileName}`);
                                process.then(function (video) {
                                    video.fnExtractSoundToMP3(`./${config.themeSongDir}/${userId}`, function (error, file) {
                                        if (!error){
                                            let filePath = `./${config.themeSongDir}/${fileName}`;
                                            try {
                                                fs.unlinkSync(filePath);
                                            }catch (e) {
                                                console.error(e)
                                            }
                                            message.reply(`Linked Theme Song to ${username}`);
                                        }else {
                                            console.error(error);
                                        }
                                    });
                                }, function (err) {
                                    console.error('Error: ' + err);
                                });
                            } catch (e) {
                                console.error(e);
                            }
                        }else {
                            message.reply(`Linked Theme Song to ${username}`);
                        }
                    }
                })
            }else if (url) {
                //If its a Youtube Video
                let fileName = `${message.guild.id}_${userId}`;
                if (/http(?:s?):\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-\_]*)(&(amp;)?‌​[\w\?‌​=]*)?/.test(url)){
                    ytdl(url, {quality: "highestaudio", filter: "audioonly"})
                        .pipe(fs.createWriteStream(`./${config.themeSongDir}/${fileName}`));
                    message.reply(`Linked Theme Song to ${username}`);
                }else if (url.includes("spotify")){
                    message.reply('Spotify Is Not Supported for Theme Linking at this Moment');
                    //TODO: Add Support for Spotify urls
                }else if (url.endsWith(".mp4")){
                    //If its a MP4 url
                    let fileName = `${message.guild.id}_${userId}`;

                    let options = {
                        directory: `./${config.themeSongDir}/`,
                        filename: fileName
                    }

                    download(url, options, (error) => {
                        if (error){
                            console.error(error);
                            message.reply(`Failed to Link Theme Song to ${username}.`);
                        }else {
                            //Converting the mp4 file to mp3
                            try {
                                let process = new ffmpeg(`./${config.themeSongDir}/${fileName}`);
                                process.then(function (video) {
                                    video.fnExtractSoundToMP3(`./${config.themeSongDir}/${userId}`, function (error, file) {
                                        if (!error){
                                            let filePath = `./${config.themeSongDir}/${fileName}`;
                                            try {
                                                fs.unlinkSync(filePath);
                                            }catch (e) {
                                                console.error(e)
                                            }
                                            message.reply(`Linked Theme Song to ${username}`);
                                        }else {
                                            console.error(error);
                                        }
                                    });
                                }, function (err) {
                                    console.error('Error: ' + err);
                                });
                            } catch (e) {
                                console.error(e);
                            }
                        }
                    })
                }else if (url.endsWith(".mp4")){
                    //If its a MP3 url
                    let fileName = `${message.guild.id}_${userId}`;

                    let options = {
                        directory: `./${config.themeSongDir}/`,
                        filename: fileName
                    }

                    download(url, options, (error) => {
                        if (error){
                            console.error(error);
                            message.reply(`Failed to Link Theme Song to ${username}.`);
                        }else {
                            //Linked the Song
                            message.reply(`Linked Theme Song to ${username}`);
                        }
                    })
                }
            }
        }
        if (method === "unlink"){
            let userId;
            let username;
            if (message.mentions.users.toJSON()[0]){
                //User Mentioned. Checking if Admin
                if (message.member.hasPermission("ADMINISTRATOR")){
                    userId = message.mentions.users.toJSON()[0].id;
                    username = message.mentions.users.toJSON()[0].username;
                }else {
                    message.reply(`Only an Admin can Unlink Other Users Theme Song`);
                    return;
                }
            }else {
                userId = message.member.user.id;
                username = message.member.user.username;
            }
            let fileName = `${message.guild.id}_${userId}`;
            fs.unlinkSync(`./${config.themeSongDir}/${fileName}`)
            message.reply('Unlinked User Theme Song');
        }
    },
};