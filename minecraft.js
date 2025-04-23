// minecraft.js
module.exports = function(RED) {
    const util = require('minecraft-server-util');
    const { Rcon } = require('rcon-client');

    // Keep original config node
    function MinecraftServerConfigNode(config) {
        RED.nodes.createNode(this, config);
        this.host = config.host;
        this.rconPort = config.rconPort;
        this.rconPassword = config.rconPassword;
    }

    // Keep original RCON node
    function MinecraftRconNode(config) {
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

    // Keep original Status node
    function MinecraftStatusNode(config) {
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

    // New specialized nodes:

    // Player Management Node
    function MinecraftPlayerNode(config) {
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

            const player = msg.player || config.player || "@p";
            const action = msg.action || this.action;
            let command = "";

            switch(action) {
                case "kick":
                    command = `kick ${player} ${msg.reason || "Kicked by server"}`;
                    break;
                case "ban":
                    command = `ban ${player} ${msg.reason || "Banned by server"}`;
                    break;
                case "pardon":
                    command = `pardon ${player}`;
                    break;
                case "gamemode":
                    const mode = msg.gamemode || this.gamemode || "survival";
                    command = `gamemode ${mode} ${player}`;
                    break;
                case "tp":
                    const coords = msg.coordinates || "0 64 0";
                    command = `tp ${player} ${coords}`;
                    break;
                case "give":
                    const item = msg.item || "diamond";
                    const amount = msg.amount || 1;
                    command = `give ${player} ${item} ${amount}`;
                    break;
                case "clear":
                    command = `clear ${player}`;
                    break;
                case "kill":
                    command = `kill ${player}`;
                    break;
                case "xp":
                    const xp = msg.xp || "1L";
                    command = `xp give ${player} ${xp}`;
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
    function MinecraftWorldNode(config) {
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
                    const time = msg.time || "day";
                    command = `time set ${time}`;
                    break;
                case "weather":
                    const weather = msg.weather || "clear";
                    command = `weather ${weather}`;
                    break;
                case "difficulty":
                    const difficulty = msg.difficulty || "normal";
                    command = `difficulty ${difficulty}`;
                    break;
                case "gamerule":
                    const rule = msg.rule;
                    const value = msg.value;
                    if(rule && value !== undefined) {
                        command = `gamerule ${rule} ${value}`;
                    }
                    break;
                case "worldborder":
                    const size = msg.size || 1000;
                    command = `worldborder set ${size}`;
                    break;
                case "setworldspawn":
                    const coords = msg.coordinates || "~ ~ ~";
                    command = `setworldspawn ${coords}`;
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

    // Server Management Node
    function MinecraftServerNode(config) {
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
                    const subaction = msg.subaction || "list";
                    const player = msg.player || "";
                    command = `whitelist ${subaction} ${player}`;
                    break;
                case "op":
                    const target = msg.player;
                    if(target) command = `op ${target}`;
                    break;
                case "deop":
                    const targetDeop = msg.player;
                    if(targetDeop) command = `deop ${targetDeop}`;
                    break;
                case "broadcast":
                    const message = msg.message || msg.payload;
                    if(message) command = `say ${message}`;
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
    function MinecraftPlayerInfoNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        this.server = RED.nodes.getNode(config.server);
        this.infoType = config.infoType;

        node.on('input', async function(msg) {
            if (!this.server) {
                node.error("Server configuration missing");
                return;
            }

            const player = msg.player || config.player || "@p";
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
                    const objective = msg.objective || "dummy";
                    command = `scoreboard players get ${player} ${objective}`;
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
                    
                    // Parse the response into a more usable format
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

    // Block Management Node
    function MinecraftBlockNode(config) {
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
            const coordinates = msg.coordinates || "~ ~ ~";
            const block = msg.block || "stone";
            let command = "";

            switch(action) {
                case "set":
                    command = `setblock ${coordinates} ${block}`;
                    break;
                case "fill":
                    const endCoordinates = msg.endCoordinates || coordinates;
                    command = `fill ${coordinates} ${endCoordinates} ${block}`;
                    break;
                case "clone":
                    const destination = msg.destination || coordinates;
                    command = `clone ${coordinates} ${msg.endCoordinates} ${destination}`;
                    break;
                case "info":
                    command = `data get block ${coordinates}`;
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
                        coordinates: coordinates,
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
    function MinecraftEntityNode(config) {
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
            const coordinates = msg.coordinates || "~ ~ ~";
            const entity = msg.entity || "zombie";
            let command = "";

            switch(action) {
                case "spawn":
                    const nbt = msg.nbt || "{}";
                    command = `summon ${entity} ${coordinates} ${nbt}`;
                    break;
                case "kill":
                    const selector = msg.selector || `@e[type=${entity}]`;
                    command = `kill ${selector}`;
                    break;
                case "count":
                    command = `execute if entity @e[type=${entity}]`;
                    break;
                case "info":
                    const target = msg.target || `@e[type=${entity},limit=1]`;
                    command = `data get entity ${target}`;
                    break;
                case "modify":
                    const targetEntity = msg.target || `@e[type=${entity},limit=1]`;
                    const data = msg.data || "{}";
                    command = `data merge entity ${targetEntity} ${data}`;
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
                        entity: entity,
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

    // Helper function to parse Minecraft command responses
    function parseMinecraftResponse(response) {
        if (!response) return null;
        
        // Try to extract numbers from responses like "Steve has 20 health"
        const numberMatch = response.match(/(\d+(\.\d+)?)/);
        if (numberMatch) return Number(numberMatch[1]);
        
        // Try to parse JSON-like responses
        if (response.includes('{') || response.includes('[')) {
            try {
                // Clean up the response to make it valid JSON
                const jsonStr = response
                    .replace(/(\w+):/g, '"$1":')  // Add quotes to keys
                    .replace(/(\d+)b/g, '$1')     // Remove byte suffix
                    .replace(/(\d+)d/g, '$1')     // Remove double suffix
                    .replace(/(\d+)f/g, '$1')     // Remove float suffix
                    .replace(/(\d+)L/g, '$1');    // Remove long suffix
                return JSON.parse(jsonStr);
            } catch (e) {
                // If parsing fails, return the raw string
                return response;
            }
        }
        
        return response;
    }

    // Register all nodes
    RED.nodes.registerType("minecraft-server-config", MinecraftServerConfigNode);

    RED.nodes.registerType("minecraft-server-info", MinecraftStatusNode);
    RED.nodes.registerType("minecraft-server-manage", MinecraftServerNode);

    RED.nodes.registerType("minecraft-player-info", MinecraftPlayerInfoNode);
    RED.nodes.registerType("minecraft-player-manage", MinecraftPlayerNode);

    
    RED.nodes.registerType("minecraft-world", MinecraftWorldNode);
    RED.nodes.registerType("minecraft-block", MinecraftBlockNode);
    RED.nodes.registerType("minecraft-entity", MinecraftEntityNode);
    
    RED.nodes.registerType("minecraft-rcon", MinecraftRconNode);

}