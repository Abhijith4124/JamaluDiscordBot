const Discord = require('discord.js');

module.exports = {
    createOutputEmbed(title, message) {
        return new Discord.MessageEmbed()
            .setTitle("Jamalu")
            .addField(title, '``` ' + message + '```');
    }
}