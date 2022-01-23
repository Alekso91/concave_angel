const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILDS] });
const threads = [];
const users = [];
require('dotenv').config()

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

function hasRole(member, id) {
    if(member.roles.cache.find(r => r.id == id) != null) {
        return true;
    }
    return false;
}

function getThread(guild, id) {
    var thread = guild.channels.cache.get(id);
    if(thread && thread.type == "GUILD_PUBLIC_THREAD") {
        return thread
    };
    return null
}

client.on('messageCreate', async (message) => {
    if(message.content.toLowerCase().startsWith(process.env.PREFIX+process.env.COMMAND)) {
        if(hasRole(message.member, process.env.ADMIN_ROLE)) {
            var args = message.content.toLowerCase().replace(process.env.PREFIX+process.env.COMMAND+" ", "").split(" ")
            if(args[0] == "add") {
                ids = args[1].replace("```", "").replace("```", "").split("\n");
                total = 0;
                valid = 0;
                //getting threads
                ids.forEach(e => {
                    if(e != "") {
                        total ++;
                        var t = getThread(message.guild, e)
                        if(t) {
                            valid ++;
                            threads.push(e)
                        }
                    }
                });
                message.channel.send(valid+"/"+total+" threads were added");
            } else if(args[0] == "remove") {
                ids = args[1].replace("```", "").replace("```", "").split("\n");
                total = 0;
                valid = 0;
                //getting threads
                ids.forEach(e => {
                    if(e != "") {
                        total ++;
                        var t = getThread(message.guild, e)
                        if(t) {
                            valid ++;
                            index = threads.indexOf(e);
                            if(index > -1) {
                                threads.splice(index, 1)
                            }
                        }
                    }
                });
                message.channel.send(valid+"/"+total+" threads were removed");
            } else if(args[0] == "list") {
                var constructor = "```{text}\n```"
                var text = ""
                if(threads.length == 0) {
                    text = "None"
                } else {
                    threads.forEach(id => {
                        text = `${text}\n${id}`
                    })
                }
                message.channel.send(constructor.replace("{text}", text))
            } else if(args[0] == "top") {
                msg2 = message;
                //args[1] = % requirement | args[2] = word requirement
                if(args[1] && args[2]) {
                    if(!isNaN(args[1]) && !isNaN(args[2])) {
                        let messages = [];
                        let status = await message.channel.send(":blue_circle: Collecting Data... :blue_circle:")
                        for(const id of threads) {
                            let channel = client.channels.cache.get(id);
                            let msgs = [];
                            let last_id;
                            while(true) {
                                var options = { limit: 100 };
                                if (last_id) {
                                    options.before = last_id;
                                };
                                a = await channel.messages.fetch(options);
                                for(const b of a) {
                                    msgs.push(b);
                                };
                                last_id = msgs[msgs.length-1][0];
                                if(a.size != 100) {
                                    break;
                                }
                            };
                            messages.push(msgs);
                        };
                        if(messages) {
                            let map = new Map();
                            for(var i of messages) {
                                for(b of i) {
                                    id = b[1].author.id;
                                    message = b[1].content.split(" ");
                                    channel = b[1].channelId;
                                    data = map.get(id);
                                    if(message.length >= args[2]) {
                                        if(data) {
                                            if(data.indexOf(channel) < 0) {
                                                data.push(channel)
                                                map.delete(id);
                                                map.set(id, data);
                                            }
                                        } else {
                                            map.set(id, [channel]);
                                        };
                                    }
                                };
                            };
                            if(map != null) {
                                status.edit(":green_circle: Processing Data :green_circle:")
                                let passing = [];
                                for (var i of map) {
                                    console.log((i[1].length/threads.length)*100);
                                    if((i[1].length/threads.length)*100 >= args[1]) {
                                        passing.push(i[0]);
                                    };
                                };
                                for (var i of passing) {
                                    try {
                                        guild = msg2.guild;
                                        member = guild.members.cache.get(i);
                                        role = guild.roles.cache.find(role => role.id === process.env.REWARD_ROLE);
                                        member.roles.add(role);
                                    } catch(e) {
                                    };
                                }
                                status.edit(":green_circle: Data Processed Successfully :green_circle:")
                            }
                        } else {
                            status.edit(":red_circle: Gathering Data Failed :red_circle:")
                        }
                    } else {
                        message.channel.send(":x: Invalid Argument")
                    }
                } else {
                    message.channel.send(":x: Missing Arguments")
                }
            } else {
                message.channel.send(":x: Invalid Argument")
            }
        } else {
            message.channel.send(":x: You cannot do this")
        }
    }
});
  
client.login(process.env.TOKEN);
