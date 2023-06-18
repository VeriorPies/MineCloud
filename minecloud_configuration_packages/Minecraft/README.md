# MineCloud: Minecraft Configuration Package

## Installation
Please follow the "How To Setup?" section in the main [README.md](../../README.md#how-to-setup). 


## Custom deployment 
These are some changes we can do to customize the server deployed.   

*Notes:  
Although it's possible to install custom mods by replacing `server.zip` and editing `./start_server.sh` before deployment, it's generally more recommend to deploy with a pre-set Configuration Package first and edit the game server later.
For more details about how to make changes to the game server after deploying, please check out the "Managing the Server after Deployment" section below.*

### Vaninlla Minecraft
#### Changing the Minecraft version
The Minecraft server version can be switched by replacing the `MINECRAFT_SERVER_DOWNLOAD_URL` in `minecloud_configs\advanced_configs\minecraft-server-download-url.ts` before deploying.
There are some websites that collect the download links of older versions of Minecraft (ex: [MCVersion.net](https://mcversions.net/))

#### Using your own Minecraft server files:
- Replace `minecloud_configs/server/server.zip` with your own Minecraft server folder (when packing the server executable, make sure files are at the top level of the server.zip file)
 - After replacing server.zip, set DEPLOY_LOCAL_SERVER_EXECUTABLE = true in `minecloud_configs/MineCloud-Configs.ts`
 - If needed, edit the server start-up commands in `minecloud_configs/server/start_server.sh`
 - This is handy when we want to spin up a new server using an old server backup.

### Fabric Minecraft
#### How to deploy a fabric minecraft server:
- Launch a placeholder server just like normal.
- Go to [this site](https://fabricmc.net/use/server/) to download Farbic Minecraft Server Launcher.
- Select your intended Minecraft version, and copy the curl command generated below.

```bash
curl -OJ https://meta.fabricmc.net/v2/versions/loader/<Minecraft Version>/<Fabric Loader Version>/<Installer Version>/server/jar
```

- Connect to the server instance using the [browser based terminal](https://github.com/AaronHo-0716/MineCloud/tree/main#accessing-the-server-terminal) or SSH, learn more at [How to connect to the server instance using SSH](../../README.md#Step-by-step-guide-for-Linux)
- Paste the curl command in the terminal and press enter.
- Type `ls` you should see a file listed in the terminal.

```bash
[ec2-user@ip-172-31-34-37 ~]$ ls
fabric-server-mc.1.19.4-loader.0.14.21-launcher.0.11.2.jar
```

- Rename the file for convenience using the `mv` command.

```bash
mv fabric-server-mc.1.19.4-loader.0.14.21-launcher.0.11.2.jar fabric-server-loader.jar
```

- Move the file to where the server's folder is located.

```bash
sudo mv farbic-server-loader.jar ../../opt/MineCloud/server
```

- Stop the current Minecraft server by running:

```bash
sudo systemctl stop minecloud.service
```

- Execute the jar file using the following command.

```bash
sudo java -jar farbic-server-loader.jar nogui
```

- After the server is ready, type `stop` to stop the server.
- Next we need to modify the `start_server.sh` file

```bash
sudo vi start_server.sh
```

## Managing the Server after Deployment
Please refer to the "Managing the Server after Deployment" section in the main [README.md](../../README.md#managing-the-server-after-deployment) for server management basic. 

### Changing the Java version
Some mods might work better with specific Java versions.  
Minecraft Configuration package [install Java using yum](https://github.com/VeriorPies/MineCloud/blob/9b4d7edee351a5d3b8fcb191d34ae4f6f00a586b/minecloud_configs/advanced_configs/custom-instance-init.ts#L16). 
 
Here is some useful info for changing the installed Java version:  
- [Amazon Corretto 8 Installation Instructions](https://docs.aws.amazon.com/corretto/latest/corretto-8-ug/amazon-linux-install.html)
- [Amazon Corretto 11 Installation Instructions](https://docs.aws.amazon.com/corretto/latest/corretto-11-ug/amazon-linux-install.html)
- [Amazon Corretto 17 Installation Instructions](https://docs.aws.amazon.com/corretto/latest/corretto-17-ug/amazon-linux-install.html)
- [Basic Yum Commands and how to use them](http://yum.baseurl.org/wiki/YumCommands.html)

### Server Files location
The server executable and world saves are located at `/opt/minecloud/server`.

## Releases
Please check out the [Configuration Packages Releases Page](../RELEASES.md)
