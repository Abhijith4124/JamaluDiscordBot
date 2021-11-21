const Discord = require('discord.js');

module.exports = {
    name: "invite",
    description: "Get the Invite link for Jamalu",
    async execute(message, args) {
        let inviteEmbed = new Discord.MessageEmbed()
            .setTitle("Jamalu")
            .setColor('#0099ff')
            .addField('🔗 Invite Link', 'https://discord.com/api/oauth2/authorize?client_id=774967875001516063&permissions=3155968&scope=bot')
            .setFooter('Thank you for Supporting Jamalu');
        message.channel.send(inviteEmbed);
    }
}