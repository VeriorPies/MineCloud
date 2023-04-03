# Minecloud
**Note: Minecloud is a temporary project name, please feel free to come up with any other name.**

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Getting start
1. Follow this tutorial to setup AWS CLI: https://aws.amazon.com/getting-started/guides/setup-environment/module-three/
2. Setup Node/NPM: https://aws.amazon.com/getting-started/guides/setup-cdk/module-one/
3. Use the following commands to confirm CDK is properlly set-up
    - `cdk --version`
    - `aws sts get-caller-identity`
4. Run `cdk bootstrap aws://<ACCOUNT-NUMBER>/<REGION>`
5. Clone this project, cd to the directory and build the project by running `npm run build`
6. Run `cdk deploy` to deploy to your CloudFormation. Verify the stack in your CloudFormation dashboard.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template


## Background-ish
* Around 1~2 year ago, we tried to find an on-demand hosting solution.
* This project, [minecraft-ondemand](https://github.com/doctorray117/minecraft-ondemand) got 1.5k stars on GitHub. But I'm NOT happy with this solution due to:
  *  It spins up the server by doing DNS query. That is, the server might spin up randomly (see: [Server starts randomly](https://github.com/doctorray117/minecraft-ondemand#server-starts-randomly))
  *  Lack of permission control  
  *  Over complicated - It took me a decent amount of time to spin it up :p - many of the components aren't necessary for us.

* Inspired by it, we end up building our own simple solution:
    * When you want to start the server, type `/mc_start` in the Discord channel.
    * The server will spin up (took around 15 sec ~ 1 min) and send the server IP address to the channel
    * When no one is online, the server will auto-shutdown.
    * Cost is almost negligible, with ~20 hours of playtime, the cost is around 56 cents each month (20 * 0.0278 (t2.large spot instance) ≈ 0.556)
    * No maintaining cost - won't cost any if aren't using the server.  
    * We also added some other features like restart, auto backup...etc
    * One small (?) benefit here is that the IP address is different every time the server start. (better-ish security, also, fixed IP is quite expensive)
* We have been using this solution for more than a year, > 1000 hours of server-up time and we are pretty satisfied with it.
* This is how it works basically:
    *  We built a discord BOT
    *  Discord BOT will forward the request to Lambda
    *  Lambda will start the EC2 instance.
    *  The Minecraft server is packed as a Linux service, running on EC2. When the service starts, it will send a message to the Discord channel.
*  **The goal of this project is to convert this into IAC (Infrastructure as Code), probably CDK, so people in the future can spin up their low-cost, on-demand Minecraft server with minimal effort.**
   * Here's some spaghetti code/script we've used in the project: 
     *  [check_user_conn.sh](https://gist.github.com/314pies/ac0aa3aa4e42e83363b6ca1a6c426564)
     *  [backup.sh](https://gist.github.com/314pies/40339beb3c5caa904af63e9b282b95ac)
     *  [baclup_manual.sh](https://gist.github.com/314pies/45800b70faeb5b6dfa0fed5a3d9b6828)
     *  [start_service.sh](https://gist.github.com/314pies/ec8cbb706b103690ac0efda1f0219bd1)
     *  [minecraft_start.sh](https://gist.github.com/314pies/7d7c1252f3bf964ec312967a1e32d7cb)
     *  [handler.js](https://gist.github.com/314pies/3aa3a559cc1c665c796ea9b0e4c0f50a)
   * We should be able to make this solution generic enough for most multi-player server hosting.
   * For task/issue, please visit the project board (https://github.com/orgs/VeriorPies/projects/1/views/1?layout=board)
