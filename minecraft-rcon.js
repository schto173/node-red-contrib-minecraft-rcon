// minecraft-rcon.js
module.exports = function(RED) {
    const util = require('minecraft-server-util');
    const { Rcon } = require('rcon-client');

    function MinecraftRconNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        // Configuration node for server details
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
                node.error(err);
                node.status({fill:"red", shape:"ring", text:"error"});
            }
        });
    }

    function MinecraftServerConfigNode(config) {
        RED.nodes.createNode(this, config);
        this.host = config.host;
        this.rconPort = config.rconPort;
        this.rconPassword = config.rconPassword;
    }

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
                const status = await util.status(this.server.host, this.server.queryPort, {
                    timeout: 5000,
                    enableSRV: true
                });

                msg.payload = {
                    online: status.players.online,
                    max: status.players.max,
                    version: status.version.name,
                    players: status.players.sample || []
                };
                
                node.send(msg);
                node.status({fill:"green", shape:"dot", text:`${status.players.online} players`});
            } catch (err) {
                node.error(err);
                node.status({fill:"red", shape:"ring", text:"error"});
            }
        });
    }

    RED.nodes.registerType("minecraft-rcon", MinecraftRconNode);
    RED.nodes.registerType("minecraft-server-config", MinecraftServerConfigNode);
    RED.nodes.registerType("minecraft-status", MinecraftStatusNode);
}