# MineCloud 
[![Release](https://img.shields.io/github/v/release/VeriorPies/MineCloud)](https://github.com/VeriorPies/Minecloud/releases) [![Documentation](https://img.shields.io/badge/documentation-brightgreen.svg)](https://github.com/VeriorPies/ParrelSync/wiki) [![License](https://img.shields.io/badge/license-MIT-green)](https://github.com/VeriorPies/ParrelSync/blob/master/LICENSE.md) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-blue.svg)](https://github.com/VeriorPies/ParrelSync/pulls) [![Chats](https://img.shields.io/discord/710688100996743200)](https://discord.gg/TmQk2qG)  

MineCloud is a CDK project that allows you to setup your own hassle-free/almost no-cost Minecraft server for your Discord server with minimal time.

(MineCloud came with Minecraft built-in, but can be easily modified to host other multiplayer game server as well)
<br>

![ShortGif](/images/MCDemo_1080-min.gif)
<p align="center">
<b>Enjoy your hassle free Minecraft server with your friends on Discord  with almost no-cost - Fully owned and managed by your selves!
</b>
<br>
</p>

## Features
1. Fully integrated with Discord - start, stop and manage your server with Discord commands
2. Auto shutdown and backup when no one is online
3. Almost free (~55 cents with 20/hr gameplay each month)
4. Fully customizable - installed whatever mods you like
5. No maintainment cost - don't have time to play? Just leave it there! It cost nothing
6. Can be easily modified to host other multiplayer game servers as well!
## How To Setup?
If you prefer, we have a step-by-step video tutorial ↓  
[![IMAGE ALT TEXT HERE](https://img.youtube.com/vi/6NC-GO1RrXQ/0.jpg)](https://www.youtube.com/watch?v=dQw4w9WgXcQ)

### **Prerequisites**
1. A [Discord](https://discord.com/) account :)
2. Node.js 18 (or above) - If haven't, go to https://nodejs.org to download and install the latest version of Node.js
    - Type `node --version` in the terminal to confirm Node is properly setup. You should see something like this:  
        ```
        v18.xx.x
        ```
3. An AWS account and AWS CLI  
   - If haven't already, go to https://aws.amazon.com/ to register an AWS account   
   - Download and install AWS CLI from [here](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
     -   Type `aws --version` in the terminal to confirm AWS CLI is properly setup. Something like this should show up:
          ```
          aws-cli/2.10.0 Python/3.11.2 Windows/10 exe/AMD64 prompt/off
          ```
   -  Setup AWS CLI credentials: 
      - Login to your AWS account, click the account name at the top-right corner and click "Security credentials". Go to the "Access keys" section and create an access key. Notes down `Access key` and `Secret access key`   
     &nbsp;&nbsp;&nbsp; <img width="80%"  src="images/get-aws-access-key.png" >  
    - In the terminal, type:  
      ```
      aws configure
      ```
      When prompted, enter the `Access key` and `Secret access key` you got from the last step (and optionally choose the "default AWS region" and "output format")
    - Once done, type `aws sts get-caller-identity` in the terminal to confirm the AWS CLI credentials are set up correctly. You should see something like this:  
        ```
        {
          "UserId": "1234567890",
          "Account": "1234567890",
          "Arn": "arn:aws:iam::1234567890:xxx"
        }
        ```  
    - Prerequisites done, now start the fun part :)
### **Set up MineCloud**
1. Download the latest release from the [release page](https://github.com/VeriorPies/Minecloud/releases), unzip it and open `minecloud_configs/MineCloud-Configs.ts`, there're some parameters we have to provide first:  
   - `AWS_ACCOUNT_NUMBER`:  Click the account name at the top-right corner of your AWS console and copy the `Account ID`
   - `AWS_REGION`: Choose a [region](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-regions-availability-zones.html) that's closet to you. Some example value are: `us-west-2`, `ap-northeast-1` or `eu-west-3`
   - `DISCORD_APP_ID` and `DISCORD_PUBLIC_KEY`: Go to [Discord Developer Portal](https://discord.com/developers/applications) and click "New Application" to create a new Discord APP.  On the "General Information" page, you will find the App Id and Public Key.   
     &nbsp;&nbsp;&nbsp; <img width="80%"  src="images/discord-app-id-and-public-key.png" > 
   - `DISCORD_BOT_TOKEN`: Go to the "Bot" page on the Discord Developer Portal, reset and copy the token  
     - This is the Discord BOT that will handle our commands. If there's no BOT shown, click the "Add Bot" button to create a new BOT  
   &nbsp;&nbsp;&nbsp; <img width="80%"  src="images/discord-bot-token.png" > 
      <p align="center">
      You can optionally setup your BOT avatar<br>
      </p>
   - `DISCORD_CHANNEL_WEB_HOOK`: 
     - Open regular Discord, go to the Discord server you want add MineCloud to, choose a text channel, and click "Edit Channel". 
     - Go to "Integrations" => "Webhooks", click "New Webhook" to create a new Webhook then copy the Webhook URL.
     - This text channel is where our VM instance will send updates to
       &nbsp;&nbsp;&nbsp; <img width="80%"  src="images/discord-channel-webhook.png" > 
      <p align="center">
      You can also optionally set up your BOT avatar here<br>
      </p>
3. Deploy MineCloud
   - Type `npm install` to install all dependencies
   - (Optional) Replace `minecloud_configs/server/server.zip` with your favorite Minecraft version, the default one is `1.19.4` (When packing server executable, make sure the server.jar is at the root level of the zip file)
   - Open the terminal in the MineCloud folder and enter `npx cdk list` to make sure the build pass. You should see the stack name being printed:  
      ```
      MineCloud
      ```
   - Bootstrap your AWS account by running `cdk bootstrap aws://<ACCOUNT-NUMBER>/<REGION>`
   - Enter `npx cdk deploy` to deploy the stack. 
   - Sit back and relax, this will take like 5~10 minutes ☕.
     - When you see a "The server instance is ready"  message shown up in the Discord channel, this means your Minecraft server is almost ready to connect :)
4. Setup BOT for your Discord server  
   - After MineCloud is deployed, go to your AWS [CloudFormation page](https://console.aws.amazon.com/cloudformation) (make sure to select the right AWS region)
   - Click on "MineCloud" stack, go to "Outputs" and copy the value of "Discord Interaction End Point Url"  
    &nbsp;&nbsp;&nbsp; <img width="80%"  src="images/discord-interaction-url.png" >
   - Go back to your [Discord Developer Portal](https://discord.com/developers/applications), select the APP created, and paste the URL into the "INTERACTIONS ENDPOINT URL" field.  
   &nbsp;&nbsp;&nbsp; <img width="80%"  src="images/discord-interaction-url-dev-portal.png" > 
   - Go to "OAuth2" => "URL Generator", select "application.commands" and click "Copy"  
   &nbsp;&nbsp;&nbsp; <img width="80%"  src="images/discord-url-generator.png" >
   - Open the copied URL (either in Discord or the browser) and add the BOT to your Discord server.
   - You are all set now - Type any command (ex: `/mc_restart`) in the Discord text channel to give it a try🎉!  
   &nbsp;&nbsp;&nbsp; <img width="80%"  src="images/discord-mc-start-command.gif" >   
### **ONE MORE THING!**
If you have deployed MineCloud more than once, there might be dangling spot instance request that will constantly charged you. **MAKE SURE TO CHECK YOUR [EC2 SPOT REQUESTS TAB](https://console.aws.amazon.com/ec2/home#SpotInstances:) AND CANCEL THE DANGLING SPOT REQUEST IF IT EXISTED!**

## // To-Do
## Story
## Architect/How this works
 => wiki
