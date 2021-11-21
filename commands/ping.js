const outputEmbed = require('../embeds/outputEmbed.js');
const config = require('../config.json');

module.exports = {
    name: 'ping',
    description: 'Check Jamalu Status',
    async execute(message, args) {
        message.channel.send(outputEmbed.createOutputEmbed("Jamalu", `🏓Latency is ${Date.now() - message.createdTimestamp}ms. API Latency is ${Math.round(args[0].ws.ping)}ms`)).then(sentMessage => {
            setTimeout(() => {
                sentMessage.delete();
            }, config.messageDeleteDelay);
        });
    },
};