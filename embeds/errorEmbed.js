const Discord = require('discord.js');

module.exports = {
    createErrorEmbed(message) {
        let warningEmbed = new Discord.MessageEmbed()
            .setTitle("Jamalu")
            .setColor('#0099ff')
            .setDescription('``` ' + message +  ' ```');
        return warningEmbed;
    }
}