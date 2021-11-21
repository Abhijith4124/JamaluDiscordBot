const musicQueue = require('../utils/MusicQueues');

module.exports = {
    Authenticate(message){
        let authenticated = false;
        if (musicQueue[message.member.guild.id]){
            let currentQueue = musicQueue[message.member.guild.id][ musicQueue[message.member.guild.id]['playingIndex']]
            if (currentQueue){
                if (message.member.user.id === currentQueue.owner){
                    authenticated = true;
                }
            }else {
                authenticated = true
            }
        }else {
            authenticated = true;
        }
        if (message.member.roles.cache.find(r => r.name === "JamaluDJ")){
            authenticated = true;
        }
        if (message.member.hasPermission("ADMINISTRATOR")){
            authenticated = true;
        }
        return authenticated;
    }
}