const errorEmbed = require('../embeds/errorEmbed.js');
const outputEmbed = require('../embeds/outputEmbed.js');
const config = require('../config.json');
const Database = require('simplest.db');
const db = new Database({
    path: './database/main.json'
});

module.exports = {
    name: "prune",
    description: "Deleted the user Commands Automatically after a certain time. prune ``` seconds ``` to enable pruning. prune ``` 0 ``` to disable pruning",
    async execute(message, args) {
        if (!message.member.hasPermission("ADMINISTRATOR")){
            message.channel.send(errorEmbed.createErrorEmbed("You do not have sufficient permission")).then(sentMessage => {
                setTimeout(() => {
                    sentMessage.delete();
                }, config.messageDeleteDelay)
            });
            return;
        }
        if (args[0]){
            if (args[0] <= 10){
                db.set(`${message.guild.id}_prune`, args[0]);
                message.channel.send(
                    outputEmbed
                        .createOutputEmbed("Pruning",
                            `Pruning is ${(db.get(`${message.guild.id}_prune`)) ? `Enabled for ${db.get(message.guild.id + '_prune')} seconds` : 'Disabled' }`)).then(setMessage => {
                    setTimeout(() => {
                        setMessage.delete();
                    }, config.messageDeleteDelay)
                });
            }else {
                message.channel.send(outputEmbed.createOutputEmbed("Pruning", "Pruning Time Cannot be longer than 10 seconds")).then(sentMessage => {
                    setTimeout(() => {
                        sentMessage.delete();
                    }, config.messageDeleteDelay)
                })
            }
        }else {
            message.channel.send(
                outputEmbed
                    .createOutputEmbed("Pruning",
                        `Pruning is ${(db.get(`${message.guild.id}_prune`)) ? `Enabled for ${db.get(message.guild.id + '_prune')}` : 'Disabled' }`)).then(setMessage => {
                            setTimeout(() => {
                                setMessage.delete();
                            }, config.messageDeleteDelay)
            });
        }
    }
}