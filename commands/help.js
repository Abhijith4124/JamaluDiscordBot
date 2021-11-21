const Discord = require('discord.js');
const fs = require('fs');
const commandFiles = fs.readdirSync('commands').filter(file => file.endsWith('.js'));

module.exports = {
    name: "help",
    description: "Shows Jamalu Commands",
    async execute(message, args) {
        const helpEmbed = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle('Jamalu')
            .setDescription('Jamalu Commands')
            .setThumbnail('https://i.imgur.com/w8LeDGp.png')
            .setFooter('Developed by SenZi', 'https://cdn.discordapp.com/attachments/905504063590907994/905504086558933072/Go_t___.jpg');
        for (const file of commandFiles) {
            const commandFile = require(`./${file}`);
            if (commandFile.private){
                continue;
            }
            if (commandFile.commands){
                commandFile.commands.forEach((command) => {
                    helpEmbed.addField(`${commandFile.name} ${command.command}`, command.description);
                })
            }else {
                helpEmbed.addField(commandFile.name, `${commandFile.description}`, true);
            }
        }
        message.channel.send(helpEmbed)
    }
}