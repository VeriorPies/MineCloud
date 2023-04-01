# Minecloud
**Note: Minecloud is a temporary project name, feel free to come up with other name ideas.**

## Background-ish
* Around 1~2 year ago, we try to find an on-demand hosting solution but didn't find one we like.
* This project, [minecraft-ondemand](https://github.com/doctorray117/minecraft-ondemand) got 1.5k stars on GitHub. But I'm NOT happy with this solution due to:
  *  It spins up the server by doing DNS query. That is, the server will spin up randomly (see: [Server starts randomly](https://github.com/doctorray117/minecraft-ondemand))
  *  Lack of permission control  
  *  Over complicated - it took me a decent amount of time to spin it up :p. And many of the components aren't necessary for us.

* Inspired by this, we end up building our own simple solution:
    * When you want to start the server, type `/mc_start` in the Discord channel.
    * The server will auto spin up (took around 15 sec ~ 1 min) and send the server IP address to the channel
    * When no one is online, the server will auto-shutdown.
    * Cost is almost negotiable, with ~20 hours of playtime, the cost is around 56 cents each month (20 * 0.0278 (t2.large spot instance) ≈ 0.556)
    * No maintaining cost - won't cost any if we didn't play it.  
    * We also added some other features like restart, auto backup...etc
    * One small (?) benefit here is that the IP address is different every time the server start. (better-ish security, also, fixed IP is quite expensive)
* We have been using this solution for more than a year, > 1000 hours of server-up time and we are pretty satisfied with it.
* This is how it works basically:
    *  We built a discord BOT
    *  Discord BOT will forward the request to Lambda
    *  Lambda will start the EC2 instance.
    *  The Minecraft server is packed as a Linux service, running on EC2. When the service starts, it will send a message to the Discord channel.
*  **The goal of this project is to convert this into IAC (Infrastructure as Code), probably CDK, so people in the future can spin up their low-cost, on-demand Minecraft server with minimal time.**
   * Here's some spaghetti code/script we've used in the project: 
     *  [check_user_conn.sh](https://gist.github.com/314pies/ac0aa3aa4e42e83363b6ca1a6c426564)
     *  [backup.sh](https://gist.github.com/314pies/47fdeb45ada66a674a6d95f7644ec94c)
     *  [baclup_manual.sh](https://gist.github.com/314pies/45800b70faeb5b6dfa0fed5a3d9b6828)
     *  [start_service.sh](https://gist.github.com/314pies/ec8cbb706b103690ac0efda1f0219bd1)
     *  [minecraft_start.sh](https://gist.github.com/314pies/7d7c1252f3bf964ec312967a1e32d7cb)
     *  [handler.js](https://gist.github.com/314pies/e93a46e48dcede75447e0e0b9502de42)
   * We should be able to make this solution generic enough for most multi-player server hosting.
   * For task/issue, please visit the project board (https://github.com/orgs/VeriorPies/projects/1/views/1?layout=board)
