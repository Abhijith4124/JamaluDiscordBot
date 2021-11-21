const outputEmbed = require('../embeds/outputEmbed.js');
const errorEmbed = require('../embeds/errorEmbed.js');
const Database = require('simplest.db');
const db = new Database({
    path: './database/main.json'
});
const config = require('../config.json');

module.exports = {
    name: "prefix",
    description: "Get or Change the Prefix",
    async execute(message, args) {
        if (args[0]) {
            //Prefix was supplied
            if (message.member.hasPermission("ADMINISTRATOR")) {
                db.set(`${message.member.guild.id}_Prefix`, args[0]);
                message.channel.send(outputEmbed.createOutputEmbed("Prefix", `Prefix Changed to ${args[0]}`));
            } else {
                message.channel.send(errorEmbed.createErrorEmbed("Only an Admin can modify the Prefix")).then(sentMessage => {
                    setTimeout(() => {
                        sentMessage.delete();
                    }, config.messageDeleteDelay);
                });
            }
        } else {
            //Prefix was not supplied so return the prefix of the server
            let prefix = (db.get(`${message.member.guild.id}_Prefix`) !== undefined) ? db.get(`${message.member.guild.id}_Prefix`) : config.prefix;
            message.channel.send(outputEmbed.createOutputEmbed("Prefix", `Current Prefix: ${prefix}`));
        }
    }
}