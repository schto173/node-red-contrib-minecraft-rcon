module.exports = function(RED) {
    const util = require('minecraft-server-util');
    const { Rcon } = require('rcon-client');

    // Config node
    function ServerConfigNode(config) {
        RED.nodes.createNode(this, config);
        this.host = config.host;
        this.rconPort = config.rconPort;
        this.rconPassword = config.rconPassword;
    }

    // Server Info Node
    function ServerInfoNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        this.server = RED.nodes.getNode(config.server);

        node.on('input', async function(msg) {
            if (!this.server) {
                node.error("Server configuration missing");
                return;
            }

            try {
                const status = await util.status(this.server.host, 25565);
                msg.payload = {
                    online: status.players.online,
                    max: status.players.max,
                    version: status.version.name,
                    players: status.players.sample || []
                };
                node.send(msg);
                node.status({fill:"green", shape:"dot", text:`${status.players.online} players`});
            } catch (err) {
                node.error('Status Error:', err);
                node.status({fill:"red", shape:"ring", text:"error"});
            }
        });
    }

    // Server Management Node
    function ServerManageNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        this.server = RED.nodes.getNode(config.server);
        this.action = config.action;

        node.on('input', async function(msg) {
            if (!this.server) {
                node.error("Server configuration missing");
                return;
            }

            const action = msg.action || this.action;
            let command = "";

            switch(action) {
                case "save-all":
                    command = "save-all";
                    break;
                case "save-off":
                    command = "save-off";
                    break;
                case "save-on":
                    command = "save-on";
                    break;
                case "stop":
                    command = "stop";
                    break;
                case "whitelist":
                    command = `whitelist ${msg.payload || "list"}`;
                    break;
                case "op":
                    command = `op ${msg.payload}`;
                    break;
                case "deop":
                    command = `deop ${msg.payload}`;
                    break;
                case "broadcast":
                    command = `say ${msg.payload}`;
                    break;
            }

            if(command) {
                const rcon = new Rcon({
                    host: this.server.host,
                    port: this.server.rconPort,
                    password: this.server.rconPassword
                });

                try {
                    await rcon.connect();
                    const response = await rcon.send(command);
                    await rcon.end();
                    msg.payload = response;
                    node.send(msg);
                    node.status({fill:"green", shape:"dot", text:"success"});
                } catch (err) {
                    node.error('RCON Error:', err);
                    node.status({fill:"red", shape:"ring", text:"error"});
                }
            }
        });
    }

    // Player Info Node
    function PlayerInfoNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        this.server = RED.nodes.getNode(config.server);
        this.infoType = config.infoType;

        node.on('input', async function(msg) {
            if (!this.server) {
                node.error("Server configuration missing");
                return;
            }

            const player = msg.payload || config.player || "@p";
            const infoType = msg.infoType || this.infoType;
            let command = "";

            switch(infoType) {
                case "health":
                    command = `data get entity ${player} Health`;
                    break;
                case "position":
                    command = `data get entity ${player} Pos`;
                    break;
                case "inventory":
                    command = `data get entity ${player} Inventory`;
                    break;
                case "experience":
                    command = `data get entity ${player} XpLevel`;
                    break;
                case "gamemode":
                    command = `data get entity ${player} playerGameType`;
                    break;
                case "food":
                    command = `data get entity ${player} foodLevel`;
                    break;
                case "effects":
                    command = `data get entity ${player} ActiveEffects`;
                    break;
                case "score":
                    command = `scoreboard players get ${player} ${msg.objective || "dummy"}`;
                    break;
            }

            if(command) {
                const rcon = new Rcon({
                    host: this.server.host,
                    port: this.server.rconPort,
                    password: this.server.rconPassword
                });

                try {
                    await rcon.connect();
                    const response = await rcon.send(command);
                    await rcon.end();
                    msg.payload = {
                        raw: response,
                        player: player,
                        type: infoType,
                        value: parseMinecraftResponse(response)
                    };
                    node.send(msg);
                    node.status({fill:"green", shape:"dot", text:"success"});
                } catch (err) {
                    node.error('RCON Error:', err);
                    node.status({fill:"red", shape:"ring", text:"error"});
                }
            }
        });
    }

    // Player Management Node
    function PlayerManageNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        this.server = RED.nodes.getNode(config.server);
        this.action = config.action;
        this.gamemode = config.gamemode;

        node.on('input', async function(msg) {
            if (!this.server) {
                node.error("Server configuration missing");
                return;
            }

            const action = msg.action || this.action;
            let command = "";

            switch(action) {
                case "kick":
                    command = `kick ${msg.payload} ${msg.reason || "Kicked by server"}`;
                    break;
                case "ban":
                    command = `ban ${msg.payload} ${msg.reason || "Banned by server"}`;
                    break;
                case "pardon":
                    command = `pardon ${msg.payload}`;
                    break;
                case "gamemode":
                    command = `gamemode ${msg.payload || this.gamemode} ${msg.target || "@p"}`;
                    break;
                case "tp":
                    command = `tp ${msg.target || "@p"} ${msg.payload}`;
                    break;
                case "give":
                    const [item, amount] = (msg.payload || "diamond 1").split(' ');
                    command = `give ${msg.target || "@p"} ${item} ${amount}`;
                    break;
                case "clear":
                    command = `clear ${msg.payload || "@p"}`;
                    break;
                case "kill":
                    command = `kill ${msg.payload || "@p"}`;
                    break;
                case "xp":
                    command = `xp give ${msg.target || "@p"} ${msg.payload || "1L"}`;
                    break;
            }

            if(command) {
                const rcon = new Rcon({
                    host: this.server.host,
                    port: this.server.rconPort,
                    password: this.server.rconPassword
                });

                try {
                    await rcon.connect();
                    const response = await rcon.send(command);
                    await rcon.end();
                    msg.payload = response;
                    node.send(msg);
                    node.status({fill:"green", shape:"dot", text:"success"});
                } catch (err) {
                    node.error('RCON Error:', err);
                    node.status({fill:"red", shape:"ring", text:"error"});
                }
            }
        });
    }

    // World Management Node
    function WorldNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        this.server = RED.nodes.getNode(config.server);
        this.action = config.action;

        node.on('input', async function(msg) {
            if (!this.server) {
                node.error("Server configuration missing");
                return;
            }

            const action = msg.action || this.action;
            let command = "";

            switch(action) {
                case "time":
                    command = `time set ${msg.payload || "day"}`;
                    break;
                case "weather":
                    command = `weather ${msg.payload || "clear"}`;
                    break;
                case "difficulty":
                    command = `difficulty ${msg.payload || "normal"}`;
                    break;
                case "gamerule":
                    if (msg.payload) {
                        const [rule, value] = msg.payload.split(' ');
                        command = `gamerule ${rule} ${value}`;
                    }
                    break;
                case "worldborder":
                    command = `worldborder set ${msg.payload || "1000"}`;
                    break;
                case "setworldspawn":
                    command = `setworldspawn ${msg.payload || "~ ~ ~"}`;
                    break;
            }

            if(command) {
                const rcon = new Rcon({
                    host: this.server.host,
                    port: this.server.rconPort,
                    password: this.server.rconPassword
                });

                try {
                    await rcon.connect();
                    const response = await rcon.send(command);
                    await rcon.end();
                    msg.payload = response;
                    node.send(msg);
                    node.status({fill:"green", shape:"dot", text:"success"});
                } catch (err) {
                    node.error('RCON Error:', err);
                    node.status({fill:"red", shape:"ring", text:"error"});
                }
            }
        });
    }

    // Block Management Node
    function BlockNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        this.server = RED.nodes.getNode(config.server);
        this.action = config.action;

        node.on('input', async function(msg) {
            if (!this.server) {
                node.error("Server configuration missing");
                return;
            }

            const action = msg.action || this.action;
            let command = "";

            switch(action) {
                case "set":
                    const [coords, block] = (msg.payload || "~ ~ ~ stone").split('|');
                    command = `setblock ${coords} ${block}`;
                    break;
                case "fill":
                    const [start, end, fillBlock] = (msg.payload || "~ ~ ~ ~ ~ ~ stone").split('|');
                    command = `fill ${start} ${end} ${fillBlock}`;
                    break;
                case "clone":
                    const [source, destination] = (msg.payload || "~ ~ ~ ~ ~ ~ ~ ~ ~").split('|');
                    command = `clone ${source} ${destination}`;
                    break;
                case "info":
                    command = `data get block ${msg.payload || "~ ~ ~"}`;
                    break;
            }

            if(command) {
                const rcon = new Rcon({
                    host: this.server.host,
                    port: this.server.rconPort,
                    password: this.server.rconPassword
                });

                try {
                    await rcon.connect();
                    const response = await rcon.send(command);
                    await rcon.end();
                    msg.payload = {
                        raw: response,
                        action: action,
                        result: parseMinecraftResponse(response)
                    };
                    node.send(msg);
                    node.status({fill:"green", shape:"dot", text:"success"});
                } catch (err) {
                    node.error('RCON Error:', err);
                    node.status({fill:"red", shape:"ring", text:"error"});
                }
            }
        });
    }

    // Entity Management Node
    function EntityNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        this.server = RED.nodes.getNode(config.server);
        this.action = config.action;

        node.on('input', async function(msg) {
            if (!this.server) {
                node.error("Server configuration missing");
                return;
            }

            const action = msg.action || this.action;
            let command = "";

            switch(action) {
                case "spawn":
                    const [entity, coords, nbt] = (msg.payload || "zombie ~ ~ ~ {}").split('|');
                    command = `summon ${entity} ${coords} ${nbt}`;
                    break;
                case "kill":
                    command = `kill ${msg.payload || "@e[type=zombie]"}`;
                    break;
                case "count":
                    command = `execute if entity ${msg.payload || "@e"}`;
                    break;
                case "info":
                    command = `data get entity ${msg.payload || "@p"}`;
                    break;
                case "modify":
                    const [target, data] = (msg.payload || "@p {}").split('|');
                    command = `data merge entity ${target} ${data}`;
                    break;
            }

            if(command) {
                const rcon = new Rcon({
                    host: this.server.host,
                    port: this.server.rconPort,
                    password: this.server.rconPassword
                });

                try {
                    await rcon.connect();
                    const response = await rcon.send(command);
                    await rcon.end();
                    msg.payload = {
                        raw: response,
                        action: action,
                        result: parseMinecraftResponse(response)
                    };
                    node.send(msg);
                    node.status({fill:"green", shape:"dot", text:"success"});
                } catch (err) {
                    node.error('RCON Error:', err);
                    node.status({fill:"red", shape:"ring", text:"error"});
                }
            }
        });
    }

    // RCON Command Node
    function RconNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        this.server = RED.nodes.getNode(config.server);

        node.on('input', async function(msg) {
            if (!this.server) {
                node.error("Server configuration missing");
                return;
            }

            const command = msg.payload || config.command;
            
            const rcon = new Rcon({
                host: this.server.host,
                port: this.server.rconPort,
                password: this.server.rconPassword
            });

            try {
                await rcon.connect();
                const response = await rcon.send(command);
                await rcon.end();
                msg.payload = response;
                node.send(msg);
                node.status({fill:"green", shape:"dot", text:"success"});
            } catch (err) {
                node.error('RCON Error:', err);
                node.status({fill:"red", shape:"ring", text:"error"});
            }
        });
    }

    // Helper function to parse Minecraft command responses
    function parseMinecraftResponse(response) {
        if (!response) return null;
        
        const numberMatch = response.match(/(\d+(\.\d+)?)/);
        if (numberMatch) return Number(numberMatch[1]);
        
        if (response.includes('{') || response.includes('[')) {
            try {
                const jsonStr = response
                    .replace(/(\w+):/g, '"$1":')
                    .replace(/(\d+)b/g, '$1')
                    .replace(/(\d+)d/g, '$1')
                    .replace(/(\d+)f/g, '$1')
                    .replace(/(\d+)L/g, '$1');
                return JSON.parse(jsonStr);
            } catch (e) {
                return response;
            }
        }
        
        return response;
    }

    // Register all nodes with simplified names
    RED.nodes.registerType("serverconfig", ServerConfigNode);
    RED.nodes.registerType("serverinfo", ServerInfoNode);
    RED.nodes.registerType("servermanage", ServerManageNode);
    RED.nodes.registerType("playerinfo", PlayerInfoNode);
    RED.nodes.registerType("playermanage", PlayerManageNode);
    RED.nodes.registerType("world", WorldNode);
    RED.nodes.registerType("block", BlockNode);
    RED.nodes.registerType("entity", EntityNode);
    RED.nodes.registerType("rcon", RconNode);
}