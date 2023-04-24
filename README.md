# MineCloud 
[![Release](https://img.shields.io/github/v/release/VeriorPies/MineCloud)](https://github.com/VeriorPies/Minecloud/releases) [![Documentation](https://img.shields.io/badge/documentation-brightgreen.svg)](https://github.com/VeriorPies/ParrelSync/wiki) [![License](https://img.shields.io/badge/license-MIT-green)](https://github.com/VeriorPies/ParrelSync/blob/master/LICENSE.md) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-blue.svg)](https://github.com/VeriorPies/ParrelSync/pulls) [![Chats](https://img.shields.io/discord/710688100996743200)](https://discord.gg/TmQk2qG)  

// To do
// Some lovely description

<br>

![ShortGif](https://i0.wp.com/www.printmag.com/wp-content/uploads/2021/02/4cbe8d_f1ed2800a49649848102c68fc5a66e53mv2.gif?fit=476%2C280&ssl=1)
<p align="center">
<b>// To do // A cool demo gif
</b>
<br>
</p>

## Features
1. // To-do
2. // Some awesome features
## How To Setup?
### Prerequisites
1. A [Discord](https://discord.com/) account :)
2. Node.js 18 (or above) - If haven't, go to https://nodejs.org to download and install the latest version of Node.js
    - Type `node --version` in the terminal to confirm node is properlly setup. You should see something like this:  
        ```
        v18.xx.x
        ```
3. An AWS account and AWS CLI  
   3.1  If haven't already, go to https://aws.amazon.com/ to register an AWS account   
   3.2 Download and install AWS CLI from [here](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
    -   Type `aws --version` in the terminal to confirm AWS CLI is properlly setup. Something like this should showed up:
        ```
        aws-cli/2.10.0 Python/3.11.2 Windows/10 exe/AMD64 prompt/off
        ```
   3.3 Setup AWS CLI credentials: 
    - Login to your AWS account, click the account name at the top-right corner and click "Security credentials". Go to the "Access keys" section and create an access key. Notes down `Access key` and `Secret access key`   
     &nbsp;&nbsp;&nbsp; <img width="80%"  src="images/get-aws-access-key.png" >  
    - In the terminal, type:  
      ```
      aws configure
      ```
      When prompted, Enter the `Access key` and `Secret access key` you got from last step (and optionally choose the default AWS region and output format)
    - Once done, type `aws sts get-caller-identity` in the terminal to confirm the AWS CLI credentials is set up correctly. You should see something like this:  
      ```
      {
        "UserId": "1234567890",
        "Account": "1234567890",
        "Arn": "arn:aws:iam::1234567890:xxx"
      }
      ```  
    - Prerequisites done, now start the fun part :)
### Set up MineCloud
1. Download the latest release from the [release page](https://github.com/VeriorPies/Minecloud/releases) and unzip it
2. Go to `minecloud_configs` folder and open `MineCloud-Configs.ts`, there're some parameters we have to provide:  
   - `AWS_ACCOUNT_NUMBER`:  Click the account name at the top-right corner in your AWS console and copy the `Accound ID`
   - `AWS_REGION`: Choose a [region](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-regions-availability-zones.html) that's closet to you. Some example value are: `us-west-2`, `ap-northeast-1` or `eu-west-3`
   - `DISCORD_APP_ID` and `DISCORD_PUBLIC_KEY`: Go to [Discord Developer Portal](https://discord.com/developers/applications), and click "New Application" to create a new Discord APP.  On the General Inforamtion page, you will find the App Id and Public Key.   
     &nbsp;&nbsp;&nbsp; <img width="80%"  src="images/discord-app-id-and-public-key.png" > 
   - `DISCORD_BOT_TOKEN`: Go to the "Bot" page on the Discord Developer Portal, reset and copy the token  
   ( This is the Discord BOT that will handle our commands. If there's no BOT shown, click the "Add Bot" button to create a new BOT)  
   &nbsp;&nbsp;&nbsp; <img width="80%"  src="images/discord-bot-token.png" > 
      <p align="center">
      You can optionally setup your BOT avatar<br>
      </p>
   - `DISCORD_CHANNEL_WEB_HOOK`: 
     - Open regular Discord, go to the Discord server you want add MineCloud to, choose a text channel, and click "Edit Channel". 
     - Go to "Integrations" => "Webhooks", click "New Webhook" to create a new Webhook then copy the Webhook URL.
     - This text channel is where our VM instance will send update to
       &nbsp;&nbsp;&nbsp; <img width="80%"  src="images/discord-channel-webhook.png" > 
        <p align="center">
        You can also optionally setup your BOT avatar here<br>
        </p>
### UPM Package
ParrelSync can also be installed via UPM package.  
After Unity 2019.3.4f1, Unity 2020.1a21, which support path query parameter of git package. You can install ParrelSync by adding the following to Package Manager.

```
https://github.com/VeriorPies/ParrelSync.git?path=/ParrelSync
```  

  
![UPM_Image](https://github.com/VeriorPies/ParrelSync/raw/master/Images/UPM_1.png?raw=true) ![UPM_Image2](https://github.com/VeriorPies/ParrelSync/raw/master/Images/UPM_2.png?raw=true)
  
or by adding 

```
"com.veriorpies.parrelsync": "https://github.com/VeriorPies/ParrelSync.git?path=/ParrelSync"
``` 

to the `Packages/manifest.json` file 


## Supported Platform
Currently, ParrelSync supports Windows, macOS and Linux editors.  

ParrelSync has been tested with the following Unity version. However, it should also work with other versions as well.
* *2020.3.1f1*
* *2019.3.0f6*
* *2018.4.22f1*


## APIs
There's some useful APIs for speeding up the multiplayer testing workflow.
Here's a basic example: 
```
if (ClonesManager.IsClone()) {
  // Automatically connect to local host if this is the clone editor
}else{
  // Automatically start server if this is the original editor
}
```
Check out [the doc](https://github.com/VeriorPies/ParrelSync/wiki/List-of-APIs) to view the complete API list.

## How does it work?
For each clone instance, ParrelSync will make a copy of the original project folder and reference the ```Asset```, ```Packages``` and ```ProjectSettings``` folder back to the original project with [symbolic link](https://docs.microsoft.com/en-us/windows-server/administration/windows-commands/mklink). Other folders such as ```Library```, ```Temp```, and ```obj``` will remain independent for each clone project.

All clones are placed right next to the original project with suffix *```_clone_x```*, which will be something like this in the folder hierarchy. 
```
/ProjectName
/ProjectName_clone_0
/ProjectName_clone_1
...
```
## Discord Server
We have a [Discord server](https://discord.gg/TmQk2qG).

## Need Help?
Some common questions and troubleshooting can be found under the [Troubleshooting & FAQs](https://github.com/VeriorPies/ParrelSync/wiki/Troubleshooting-&-FAQs) page.  
You can also [create a question post](https://github.com/VeriorPies/ParrelSync/issues/new/choose), or ask on [Discord](https://discord.gg/TmQk2qG) if you prefer to have a real-time conversation.

## Support this project 
A star will be appreciated :)

## Credits
This project is originated from hwaet's [UnityProjectCloner](https://github.com/hwaet/UnityProjectCloner)
