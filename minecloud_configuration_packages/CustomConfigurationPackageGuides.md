# MineCloud Configuration Package

## What are MineCloud Configuration Packages?
A **Configuration Package** is a collection of MineCloud configuration pre-sets which allow users to use it to quickly spin up a new game server. For instance, people can use the `minecraft_vanilla_1.19.4.zip` package to spin up a Minecraft server or use the `terraria_vanilla_1449.zip` package to spin up a Terraria one.   
People can also create and publish their own configuration package for others to use!

## How to Create and Publish a Configuration Package?

If there's no existing Configuration Package for your favorite games or mods - here're are some guides for you to create and publish one:

1. Fork and clone the repository. Check out the `main` branch.
2. Open additional ports that are required (e.g. which port number?, TCP or UDP?) for the game server by editing `minecloud_configs/advanced_configs/port-configs.ts`.  
3. Deploy MineCloud by following the typical deployment workflow. A placeholder Minecraft server should be spun up.
4. Connect to the terminal and run `sudo systemctl stop minecloud.service` to stop the placeholder Minecraft server
    - Please check out the "Managing The Server After Deployment" section in the main [README.md](../README.md#managing-the-server-after-deployment) for how to interact with the server after deployment.  
5. Set up the game server and notes down the commands and files required. We will need this for our EC2 init configs later.
6. Prepare the `get_connection_count.sh` script:  
    - This script is to help MineCloud determine whether there are still players online.  
    - The default `get_connection_count.sh` determine how many players are online by checking the TCP connection on port `25565`. If the game is also using TCP as the network protocol, modify the port number and the script should work.
    - If the game is using UDP. Copy the `get_connection_count_udp_template.sh` template into the `get_connection_count.sh` file and edit the port number.  
    - Test out the script:  
      - On the server, type `sudo su` to switch to root user and type `source get_connection_count.sh; get_current_connection_count` to run and print out the return value of the script.  
      - Have the game client connect/disconnect to the server:  
        - Run the script to confirm the return value is expected.
        - It should return 0 when no one is connected and >=1 when there're players connected
      - Type `exit` to exit the root user mode
    - Once done, we can start preparing the configuration package files
7. Edit EC2 initialization commands in `minecloud_configs/advanced_configs/custom-instance-init.ts`.  
   - Commands are made of [CDK APIs](https://docs.aws.amazon.com/cdk/api/v2/)
   - Some useful APIs are:  
     - [InitCommand](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.InitCommand.html) to execute Linux commands
       - Checkout [this section](https://github.com/VeriorPies/MineCloud/wiki/FAQs-&-Troubleshooting#useful-linux-commands) on the wiki for useful Linux commands.
     - [InitFile.FromXXX](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.InitFile.html) to setup files
        - We can use these methods/classes to set up files from the local disk or with Web URLs.
        - Other than using this to setup files, we can also replace `minecloud_configs/server/server.zip` with a custom server file and set `DEPLOY_LOCAL_SERVER_EXECUTABLE` in `minecloud_configs/MineCloud-Configs.ts` to true. The `server.zip` will be extracted to `/opt/minecloud/server` after deployment. Commands in `custom-instance-init.ts` will be executed after the `server.zip` is extracted - this can be helpful if we need to grant execution permission to certain scripts in the `server.zip`.
     - [InitPackage](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.InitPackage.html): This can be used to install packages (ex: Java package) require for the game server
8. Edit the `minecloud_configs/server/start_server.sh` and `minecloud_configs/server/stop_server.sh` script: 
   - These scripts are being used to start and stop the game server  
   - This script will be executed from the `/opt/minecloud/server` directory by the MineCloud service.
9. Edit `minecloud_configs/advanced_configs/backup-folders.txt` to specify the folders we want to back up.
10. Edit `minecloud_configs/MineCloud-Configs.ts` to specify parameters like instance type, disk size...etc
11. Type `npx cdk list` and `npx cdk deploy` to deploy with the new configs.
12. Troubleshooting if something went wrong:  
    - If the deployment failed due to EC2 initialization, consider setting `IGNORE_FAILURE_ON_INSTANCE_INIT` to `true` in `minecloud_configs/advanced_configs/other-configs.ts` to prevent rollback. 
    - If there's an issue with the server start-up, follow the "Manually Start/Stop the Game Server" section in the main [README.md](../README.md#manually-startstop-the-game-server) for troubleshooting.
13. Once we have everything working, it's time to publish your configuration package!
14. To do so:  
    - Zip the `MineCloud-Configs.ts` file, `/advanced_configs`, and `/server` folders in `/minecloud_configs`. Rename it and copy to `minecloud_configs/<game_name>/releases/`
    - Copy the config files into `minecloud_configs/<game_name>/dev/<config_package_name>/`
    - Update `minecloud_configs/<game_name>/README.md` if needed
    - Edit `minecloud_configuration_packages/RELEASES.md` to add your configuration package download link to the list.  
    - If it's a new game being supported, also edit the main README to add it to the support list

15. You are all set now! Just commit, create a [pull request](https://github.com/VeriorPies/MineCloud/pulls) to the `origin/main` branch, and wait for it to be merged!