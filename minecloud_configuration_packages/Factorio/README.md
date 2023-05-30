# MineCloud: Factorio Configuration Package

## Installation
Please follow the "How To Setup?" section in the main [README.md](../../README.md#how-to-setup). 


## Customize Deployment 
These are some changes we can do to customize the server deployed.   

### Vaninlla
#### Changing the Game Version
The server version can be changed by replacing the `FACTORIO_SERVER_DOWNLOAD_URL` in `minecloud_configs\advanced_configs\factorio-server-download-url.ts` before deploying.  
Other version's download link can be found at https://www.factorio.com/download/archive
(Note: Only version after 1.1.68 support headless server)

## Managing the Server after Deployment
Please refer to the "Managing the Server after Deployment" section in the main [README.md](../../README.md#managing-the-server-after-deployment) for server management basic. 

### Server Files location
The server executable is located at `/opt/minecloud/server`.
The default save file is `/opt/minecloud/server/saves/my-save.zip`.

## Releases
Please check out the [Configuration Packages Releases Page](../RELEASES.md)