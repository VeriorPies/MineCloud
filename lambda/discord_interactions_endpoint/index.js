// Spaghetti code
// Might want to re-write it with typescript later
const nacl = require('tweetnacl');
var AWS = require('aws-sdk');
const SSM = new AWS.SSM();
var coldStart = true;
console.log("This is a cold start.");

exports.handler = async (event, context, callback) => {
  console.log('Disabling context.callbackWaitsForEmptyEventLoop')
  context.callbackWaitsForEmptyEventLoop = false
  
  // Checking signature (requirement 1.)
  // Your public key can be found on your application in the Developer Portal page
  const PUBLIC_KEY = process.env.PUBLIC_KEY;
  const server_instance_id = process.env.INSTANCE_ID;
  const ec2_instance_region = process.env.REGION;

  const signature = event.headers['x-signature-ed25519'];
  const timestamp = event.headers['x-signature-timestamp'];
  const strBody = event.body;

  const isVerified = nacl.sign.detached.verify(
    Buffer.from(timestamp + strBody),
    Buffer.from(signature, 'hex'),
    Buffer.from(PUBLIC_KEY, 'hex')
  );
  if (!isVerified) {
    return {
      statusCode: 401,
      body: JSON.stringify('invalid request signature'),
    };
  }

  // Replying to ping (requirement 2.)
    console.log('strB ',strBody)
    const body = JSON.parse(strBody);
    console.log(body)
    if (body.type == 1) {
      return {
        statusCode: 200,
        body: JSON.stringify({ "type": 1 }),
      }
    }

  //-------------Start processing discord commands-------------
  if(coldStart){
      coldStart = false;
      return JSON.stringify({ 
        "type": 4,
        "data": { "content": "Just woke up...\n Can you try again?" }
      })
  }
  
  const output = {
        type: 4,
        data: { content: "What?" }
    };
  
  const ec2 = new AWS.EC2({ region: ec2_instance_region });
  var params = {
         InstanceIds: [
            server_instance_id
         ],
         DryRun: false
      };
  
  if (body.data.name == 'mc_start'){
   return ec2.startInstances({ InstanceIds: [server_instance_id] }).promise()
      .then(() => {
        console.log("startInstances.then() invoked!")
        var resp = JSON.stringify({ 
              "type": 4,
              "data": { "content": "Got it~ Starting the server for you (๑•ั็ω•็ั๑)~~" }
            })
        callback(null, resp)
      })
      .catch(err => {
        console.log("startInstances.catch() invoked, error -> \n" + err)
        var resp = JSON.stringify({ 
              "type": 4,
              "data": { "content": 
                "Hmmm...There's some issue with the server instance...\n" + 
                "This is what AWS told me:\n" 
                +"\`\`\`"+ err + "\`\`\`"
                + "\nMaybe try again in another minute?"
              }
            })
        callback(null, resp)
    });
  }
  
  if (body.data.name == 'mc_stop'){
    return ec2.stopInstances({ InstanceIds: [server_instance_id] }).promise()
      .then(() => {
        console.log("stopInstances.then() invoked!")
        var resp = JSON.stringify({ 
              "type": 4,
              "data": { "content": "OK~ Shutting the server down~" }
            })
        callback(null, resp)
      })
      .catch(err => {
        console.log("stopInstances.catch() invoked, error -> \n" + err)
        var resp = JSON.stringify({ 
              "type": 4,
              "data": { "content": 
                "Hmmm...There's some issue when shutting down the server instance...\n" + 
                "This is what AWS told me:\n" 
                +"\`\`\`"+ err + "\`\`\`"
                + "\nMaybe try again in another minute?"
              }
            })
        callback(null, resp)
    });
  }
  
  if (body.data.name == 'mc_backup'){
    const instanceIdList = [server_instance_id];
    const cmd = ["cd /opt/minecraft/", "sudo ./server_backup.sh"];
    console.log('Sending commands to instances:');
    console.log(instanceIdList, cmd);
    
    try{
      const commandResults = await sendCommands(instanceIdList, cmd);
       return JSON.stringify({ 
              "type": 4,
              "data": { "content": "OKOK~ Contacting the server instance~~" }
       });
    }catch (err) {
      console.log('sendCommands failed', err);
      return JSON.stringify({ 
              "type": 4,
              "data": { "content": "Hmm...There's some issue contacting server instance... \n This is want AWS told me: \n" 
              +"\`\`\`" +err +"\`\`\`"}
       });
    }
  }
  
  if (body.data.name == 'mc_get_latest_backup'){
    const instanceIdList = [server_instance_id];
    const cmd = ["cd /opt/minecraft/", "sudo ./get_latest_server_backup.sh"];
    console.log('Sending commands to instances:');
    console.log(instanceIdList, cmd);
    
    try{
      const commandResults = await sendCommands(instanceIdList, cmd);
       return JSON.stringify({ 
              "type": 4,
              "data": { "content": "OKOK~ Contacting the server instance~~" }
       });
    }catch (err) {
      console.log('sendCommands failed', err);
      return JSON.stringify({ 
              "type": 4,
              "data": { "content": "Hmm...There's some issue contacting server instance... \n This is want AWS told me: \n" 
              +"\`\`\`" +err +"\`\`\`"}
       });
    }
  }

  if (body.data.name == 'mc_restart'){
    const instanceIdList = [server_instance_id];
    const cmd = ["sudo systemctl restart minecraft"];
    console.log('Sending commands to instances:');
    console.log(instanceIdList, cmd);
    
    try{
      const commandResults = await sendCommands(instanceIdList, cmd);
       return JSON.stringify({ 
              "type": 4,
              "data": { "content": "OK~ Restarting server instance~~" }
       });
    }catch (err) {
      console.log('sendCommands failed', err);
      return JSON.stringify({ 
              "type": 4,
              "data": { "content": "Hmm...There's some issue contacting server instance... \n This is want AWS told me: \n" 
              +"\`\`\`" +err +"\`\`\`"}
       });
    }
  }
  

  
  console.log("Code end reach");
   // If no handler implemented for Discord's request
  return JSON.stringify({ 
              "type": 4,
              "data": { "content": "What??" }
  })
};


function sendCommands(instanceIdList, cmd) {
  return new Promise(function(resolve, reject) {
    const params = {
      InstanceIds: instanceIdList,
      DocumentName: 'AWS-RunShellScript',
      Parameters: {
        commands: cmd,
      },
    };
    SSM.sendCommand(params, function(err, data) {
      if (err) {
        console.log(err);
        reject(err);
      }
      resolve(data);
    });
  });
}