# Node-RED Minecraft Integration
A comprehensive Node-RED package for interacting with Minecraft servers through RCON and Query protocols. This package provides nodes for server management, player control, world manipulation, and entity handling.

## Table of Contents
1. [Configuration](#configuration)
2. [Available Nodes](#available-nodes)
3. [Node Usage](#node-usage)
4. [Examples](#examples)
5. [Troubleshooting](#troubleshooting)

## Configuration
### Server Configuration Node (serverconfig)
This is a configuration node that stores your Minecraft server connection details.

Settings:
- **Host**: Server IP address or hostname
- **RCON Port**: RCON port (default: 25575)
- **RCON Password**: RCON password from server.properties

## Available Nodes

### Basic Server Nodes
- **serverinfo**: Gets server status information
- **servermanage**: Handles server administration tasks
- **rcon**: Sends raw RCON commands
- **volumebackup**: Manages server volume backups

### Player Nodes
- **playerinfo**: Retrieves player-specific information
- **playermanage**: Handles player management commands

### World Nodes
- **world**: Controls world-related settings
- **block**: Manages blocks in the world
- **entity**: Controls entities in the world

## Node Usage

### RCON Command Node (rcon)
Sends raw RCON commands to the server.

Input:
- `msg.payload`: Raw Minecraft command (string)

Example:
```javascript
msg.payload = "time set day";
return msg;
```

### Server Info Node (serverinfo)
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

### Volume Backup Node (volumebackup)
Manages server volume backups.

Actions:
- **backup**: Creates a backup
- **restore**: Restores from backup

Input:
```javascript
msg.action = "backup"; // or "restore"
msg.payload = "backup_name"; // optional
```

### Player Management Node (playermanage)
Handles player-related commands.

Actions:
- **kick**: Removes player from server
- **ban**: Bans player from server
- **pardon**: Unbans player
- **gamemode**: Changes player gamemode
- **tp**: Teleports player
- **give**: Gives items to player
- **clear**: Clears inventory
- **kill**: Kills player
- **xp**: Gives experience

Example:
```javascript
// Kick player
msg.payload = "Steve";
msg.action = "kick";
msg.reason = "Taking a break";

// Give items
msg.payload = "diamond 64";
msg.action = "give";
msg.target = "Steve";
```

### Player Info Node (playerinfo)
Retrieves player information.

Info Types:
- **health**: Player health points
- **position**: Player coordinates
- **inventory**: Inventory contents
- **experience**: XP level
- **gamemode**: Current game mode
- **food**: Food level
- **effects**: Active effects
- **score**: Scoreboard scores

Example:
```javascript
msg.payload = "Steve";
msg.infoType = "health";
// Output: { "raw": "Steve has 20 health", "value": 20 }
```

### World Management Node (world)
Controls world settings.

Actions:
- **time**: Sets world time
- **weather**: Controls weather
- **difficulty**: Sets game difficulty
- **gamerule**: Sets game rules
- **worldborder**: Sets world border
- **setworldspawn**: Sets world spawn point

Example:
```javascript
msg.action = "weather";
msg.payload = "clear"; // clear, rain, thunder
```

### Block Management Node (block)
Manages blocks in the world.

Actions:
- **set**: Places a block
- **fill**: Fills an area
- **clone**: Copies blocks
- **info**: Gets block data

Example:
```javascript
msg.action = "set";
msg.payload = "0 64 0|stone"; // coordinates|block
```

### Entity Management Node (entity)
Controls entities in the world.

Actions:
- **spawn**: Creates entity
- **kill**: Removes entities
- **count**: Counts entities
- **info**: Gets entity data
- **modify**: Modifies entity NBT

Example:
```javascript
msg.action = "spawn";
msg.payload = "zombie|~ ~2 ~|{CustomName:\"Boss\"}"; // entity|coordinates|nbt
```

## Examples

### Basic Server Monitor
```json
[
    {
        "id": "status1",
        "type": "serverinfo",
        "server": "server-config-1",
        "name": "Server Status"
    },
    {
        "id": "debug1",
        "type": "debug"
    }
]
```

### Automatic Day/Night Cycle
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
        "type": "rcon",
        "server": "server-config-1"
    }
]
```

### Player Join Notification
```json
[
    {
        "id": "status1",
        "type": "serverinfo",
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
        "type": "rcon"
    },
    {
        "id": "debug1",
        "type": "debug"
    }
]
```

## Best Practices

1. **Error Handling**
   - Use try-catch blocks
   - Check server responses
   - Validate input data

2. **Resource Management**
   - Close RCON connections after use
   - Limit query frequency
   - Use appropriate timeouts

3. **Security**
   - Store credentials in configuration nodes
   - Validate input data
   - Use appropriate player selectors

## License
MIT License - feel free to use in your projects.