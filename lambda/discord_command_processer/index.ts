import { Context } from 'aws-lambda';
import * as AWS from 'aws-sdk';

// The deployment will fail if exception was thrown.
exports.handler = async (event: any, context: Context) => {
  console.log("Invoked v6!");
  console.log('event: ', event);
  
  const body = JSON.parse(event.body);
  const commandName = body.data.name;
  const responseToken = body.token;
  console.log('commandName: ', commandName);
  console.log('responseToken: ', responseToken);


  const server_instance_id = process.env.INSTANCE_ID!;
  const ec2_instance_region = process.env.EC2_REGION;

  const ec2 = new AWS.EC2({ region: ec2_instance_region });
  var params = {
    InstanceIds: [server_instance_id],
    DryRun: false
  };

  if (commandName == 'mc_start') {
    try {
      const result = await ec2.startInstances({ InstanceIds: [server_instance_id] }).promise();
      console.log("startInstances result: \n", result);
    } catch (err) {
      console.error(`startInstances error: \n`, err)
    }
  }

  if (commandName == 'mc_stop') {
    try {
      const result = await ec2.stopInstances({ InstanceIds: [server_instance_id] }).promise();
      console.log("stopInstance result: \n", result);
    } catch (err) {
      console.error(`stopInstance error: \n`, err)
    }
  }

  const response = {
    status: 200
  };


  return response;
};
