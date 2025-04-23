```markdown
# Node-RED Minecraft Integration
A comprehensive Node-RED package for interacting with Minecraft servers through RCON and Query protocols.

## Table of Contents
1. [Installation](#installation)
2. [Configuration](#configuration)
3. [Basic Nodes](#basic-nodes)
4. [Player Management](#player-management)
5. [World Management](#world-management)
6. [Server Management](#server-management)
7. [Player Information](#player-information)
8. [Block Management](#block-management)
9. [Entity Management](#entity-management)
10. [Examples](#examples)
11. [Troubleshooting](#troubleshooting)

## Installation
```bash
npm install @yourname/node-red-minecraft
```

## Configuration
### Server Configuration Node
This is a configuration node that stores your Minecraft server connection details.

Settings:
- **Host**: Server IP address or hostname
- **RCON Port**: RCON port (default: 25575)
- **RCON Password**: RCON password from server.properties

## Basic Nodes

### RCON Command Node
Sends raw RCON commands to the server.

Inputs:
- `msg.payload`: Raw Minecraft command (string)

Example:
```javascript
msg.payload = "time set day";
return msg;
```

### Status Node
Gets server status information.

Output:
```javascript
{
    "online": 5,          // Number of online players
    "max": 20,           // Maximum players
    "version": "1.19.2", // Server version
    "players": [         // Array of online players
        {"name": "Steve", "id": "..."}
    ]
}
```

## Player Management

### Player Management Node
Handles player-related commands.

Actions:
- **Kick**: Removes player from server
  ```javascript
  msg.action = "kick";
  msg.player = "Steve";
  msg.reason = "Taking a break";
  ```

- **Ban**: Bans player from server
  ```javascript
  msg.action = "ban";
  msg.player = "Steve";
  msg.reason = "Breaking rules";
  ```

- **Gamemode**: Changes player gamemode
  ```javascript
  msg.action = "gamemode";
  msg.player = "Steve";
  msg.gamemode = "creative"; // survival, creative, adventure, spectator
  ```

- **Teleport**: Teleports player
  ```javascript
  msg.action = "tp";
  msg.player = "Steve";
  msg.coordinates = "100 64 100";
  ```

- **Give**: Gives items to player
  ```javascript
  msg.action = "give";
  msg.player = "Steve";
  msg.item = "diamond";
  msg.amount = 64;
  ```

## World Management

### World Management Node
Controls world-related settings.

Actions:
- **Time**: Sets world time
  ```javascript
  msg.action = "time";
  msg.time = "day"; // day, night, noon, midnight
  ```

- **Weather**: Controls weather
  ```javascript
  msg.action = "weather";
  msg.weather = "clear"; // clear, rain, thunder
  ```

- **Difficulty**: Sets game difficulty
  ```javascript
  msg.action = "difficulty";
  msg.difficulty = "normal"; // peaceful, easy, normal, hard
  ```

## Server Management

### Server Management Node
Handles server administration.

Actions:
- **Save**: World saving controls
  ```javascript
  msg.action = "save-all"; // save-all, save-off, save-on
  ```

- **Whitelist**: Manages whitelist
  ```javascript
  msg.action = "whitelist";
  msg.subaction = "add"; // add, remove, list
  msg.player = "Steve";
  ```

- **Broadcast**: Sends server message
  ```javascript
  msg.action = "broadcast";
  msg.message = "Server restarting in 5 minutes!";
  ```

## Player Information

### Player Info Node
Retrieves player-specific information.

Info Types:
- **Health**: Player health points
  ```javascript
  msg.infoType = "health";
  msg.player = "Steve";
  // Output: { "raw": "Steve has 20 health", "value": 20 }
  ```

- **Position**: Player coordinates
  ```javascript
  msg.infoType = "position";
  msg.player = "Steve";
  // Output: { "raw": "...", "value": [100, 64, 100] }
  ```

- **Inventory**: Player inventory contents
  ```javascript
  msg.infoType = "inventory";
  msg.player = "Steve";
  // Output: { "raw": "...", "value": [{slot: 0, id: "minecraft:diamond", ...}] }
  ```

## Block Management

### Block Node
Manages blocks in the world.

Actions:
- **Set**: Places a block
  ```javascript
  msg.action = "set";
  msg.coordinates = "0 64 0";
  msg.block = "stone";
  ```

- **Fill**: Fills an area
  ```javascript
  msg.action = "fill";
  msg.coordinates = "0 64 0";
  msg.endCoordinates = "10 64 10";
  msg.block = "stone";
  ```

- **Clone**: Copies blocks
  ```javascript
  msg.action = "clone";
  msg.coordinates = "0 64 0";
  msg.endCoordinates = "10 74 10";
  msg.destination = "20 64 20";
  ```

## Entity Management

### Entity Node
Controls entities in the world.

Actions:
- **Spawn**: Creates entity
  ```javascript
  msg.action = "spawn";
  msg.entity = "zombie";
  msg.coordinates = "~ ~2 ~";
  msg.nbt = "{CustomName:\"Boss\"}";
  ```

- **Kill**: Removes entities
  ```javascript
  msg.action = "kill";
  msg.selector = "@e[type=zombie]";
  ```

- **Info**: Gets entity data
  ```javascript
  msg.action = "info";
  msg.target = "@e[type=zombie,limit=1]";
  ```

## Examples

### Basic Server Monitor
```json
[
    {
        "id": "status1",
        "type": "minecraft-status",
        "server": "server-config-1",
        "name": "Server Status"
    },
    {
        "id": "debug1",
        "type": "debug"
    }
]
```

### Auto Day/Night Cycle
```json
[
    {
        "id": "inject1",
        "type": "inject",
        "repeat": "300",
        "payload": "time set day",
        "payloadType": "str"
    },
    {
        "id": "rcon1",
        "type": "minecraft-rcon",
        "server": "server-config-1"
    }
]
```

### Player Join Notification
```json
[
    {
        "id": "status1",
        "type": "minecraft-status",
        "server": "server-config-1",
        "name": "Monitor Players"
    },
    {
        "id": "function1",
        "type": "function",
        "func": "let oldPlayers = context.get('players') || [];\nlet newPlayers = msg.payload.players;\nlet joined = newPlayers.filter(p => !oldPlayers.includes(p));\nif(joined.length > 0) {\n    msg.payload = `Players joined: ${joined.join(', ')}`;\n    context.set('players', newPlayers);\n    return msg;\n}"
    },
    {
        "id": "notify1",
        "type": "debug"
    }
]
```

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check if RCON is enabled in server.properties
   - Verify RCON port and password
   - Ensure server is running

2. **Command Failed**
   - Check player names are correct
   - Verify coordinates are valid
   - Ensure command syntax is correct

3. **Parse Errors**
   - Check NBT data format
   - Verify JSON syntax in messages
   - Ensure all required fields are provided

### Debug Mode
Add a debug node to see detailed responses:
```json
[
    {
        "id": "minecraft1",
        "type": "minecraft-rcon"
    },
    {
        "id": "debug1",
        "type": "debug"
    }
]
```

## Best Practices

1. **Error Handling**
   ```javascript
   node.on('input', async function(msg) {
       try {
           // Your code
       } catch (err) {
           node.error('Error: ' + err.message);
           msg.payload = { error: err.message };
           node.send(msg);
       }
   });
   ```

2. **Resource Management**
   - Close RCON connections after use
   - Limit query frequency
   - Use appropriate timeouts

3. **Security**
   - Store credentials in configuration nodes
   - Validate input data
   - Use appropriate player selectors

## Contributing
Contributions are welcome! Please submit pull requests to our GitHub repository.

## License
MIT License - feel free to use in your projects.
```

This documentation provides:
1. Clear installation instructions
2. Detailed node descriptions
3. Example usage for each node
4. Common troubleshooting steps
5. Best practices
6. Code examples

Would you like me to expand on any particular section or add more examples?