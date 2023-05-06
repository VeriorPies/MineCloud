# MineCloud: Terraria Edition

[![Release](https://img.shields.io/github/v/release/VeriorPies/MineCloud)](https://github.com/VeriorPies/Minecloud/releases) [![Documentation](https://img.shields.io/badge/documentation-brightgreen.svg)](https://github.com/VeriorPies/MineCloud/wiki) [![License](https://img.shields.io/badge/license-MIT-green)](https://github.com/VeriorPies/MineCloud/blob/main/LICENSE) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-blue.svg)](https://github.com/VeriorPies/MineCloud/pulls) [![Chats](https://img.shields.io/discord/1101786911846182964)](https://discord.gg/fuTdbYrbZm)

This is a sample project showcasing how to modify MineCloud to host other multiplayer game server - using Terraria as example.  

## Setup
The setup is almost the same - the only difference is instead of downloading MineCloud from the release page,  click the "Code" button at the top-right corner and select "Download ZIP" to download the Terraria edition.

## How do I configure MineCloud to host other multiplayer game servers?
(Refer to this [commit](https://github.com/VeriorPies/MineCloud/commit/b76085ded0824b43ded3264b990977a867e8a610?diff=split) to see all the changes being made in order to host Terraria server)  
All the common config files for hosting a general multiplayer game server are placed under the `minecloud_configs` folder, these files include:  
  - `MineCloud-Configs.ts`: Contain the most basic configs
  - server/ 
    - `start_server.sh`: Script being placed in the server folder to start the game server. MineCloud will run this script to start the server
    - `stop_server.sh`: Script being placed in the server folder to stop the game server. MineCloud will run this script to stop the server
    - `server.zip`: This will be deployed and unzipped into the server folder when `DEPLOY_LOCAL_SERVER_EXECUTABLE ` is set to true in `MineCloud-Configs.ts` (when creating `server.zip`, make sure all the files are at the top level)
  - advanced_configs/
    - `custom-instance-init.ts`: Custom EC2 init configs. This will be executed before other EC2 init processes (except local `server.zip` deployment - this can allow us to grant execution permission to server executable if needed)
    - `get_connection_count.sh`: Override the `get_current_connection_count()` method to return how many players are currently connected. When the return is zero, the server will auto shut down  
    - `port-configs.ts`: To configure which ports should be opened
