import { Context } from 'aws-lambda';
import * as AWS from 'aws-sdk';
import axios from 'axios';

const InstanceIds = [process.env.INSTANCE_ID!];
const ec2_instance_region = process.env.EC2_REGION;
let responseToken = '';

const SSM = new AWS.SSM();
const ec2 = new AWS.EC2({ region: ec2_instance_region });

exports.handler = async (event: any, context: Context) => {
  console.log('event: ', event);

  const body = JSON.parse(event.body);

  responseToken = body.token;
  console.log('responseToken: ', responseToken);

  const commandName = body.data.name;
  console.log('commandName: ', commandName);

  if (commandName == 'mc_start') {
    try {
      const result = await ec2.startInstances({ InstanceIds }).promise();
      console.log('startInstances succeed, result: \n', result);
      await sendDeferredResponse('OK! Starting the server instance (`･ω･´)~~');
    } catch (err) {
      console.error(`startInstances error: \n`, err);
      await sendDeferredResponse(
        getAWSErrorMessageTemplate('starting server instance', err)
      );
      await sendDeferredResponse('Try in another minute?');
    }
  }

  if (commandName == 'mc_stop') {
    try {
      const result = await ec2.stopInstances({ InstanceIds }).promise();
      console.log('stopInstance suceeed, result: \n', result);
      await sendDeferredResponse('OK! Shutting down the server instance!');
    } catch (err) {
      console.error(`stopInstance error: \n`, err);
      await sendDeferredResponse(
        getAWSErrorMessageTemplate('stopping server instance', err)
      );
    }
  }

  if (commandName == 'mc_restart') {
    try {
      const result = await sendCommands(['sudo systemctl restart minecloud']);
      console.log('mc_restart result: ', result);
      await sendDeferredResponse('OK, contacting server instance!');
    } catch (err) {
      console.error(`mc_restart error: \n`, err);
      await sendDeferredResponse(
        getAWSErrorMessageTemplate('restarting server service', err)
      );
    }
  }

  if (commandName == 'mc_backup') {
    try {
      const result = await sendCommands([
        'cd /opt/minecloud/',
        'sudo ./server_manual_backup.sh'
      ]);
      console.log('mc_backup result: ', result);
      await sendDeferredResponse('OK, contacting server instance!');
    } catch (err) {
      console.error(`mc_backup error: \n`, err);
      await sendDeferredResponse(
        getAWSErrorMessageTemplate('making backup', err)
      );
    }
  }

  if (commandName == 'mc_backup_download') {
    try {
      const result = await sendCommands([
        'cd /opt/minecloud/',
        'sudo ./get_latest_server_backup.sh'
      ]);
      console.log('mc_backup_download result: ', result);
      await sendDeferredResponse('OK, contacting server instance!');
    } catch (err) {
      console.error(`mc_backup error: \n`, err);
      await sendDeferredResponse(
        getAWSErrorMessageTemplate('getting latest backup', err)
      );
    }
  }

  return {
    status: 200
  };
};

const apiEndpoint = 'https://discord.com/api/v10/webhooks';
// Send Discord deferred response
async function sendDeferredResponse(message: string) {
  const body = {
    content: message
  };
  const request = {
    method: 'post',
    url: `${apiEndpoint}/${process.env.APP_ID}/${responseToken}`,
    data: body
  };

  const response = await axios(request);
  console.log('sendDeferredResponse result: ', response);
}

async function sendCommands(cmd: string[]) {
  const params = {
    InstanceIds,
    DocumentName: 'AWS-RunShellScript',
    Parameters: {
      commands: cmd
    }
  };
  return SSM.sendCommand(params).promise();
}

function getAWSErrorMessageTemplate(
  actionText: string,
  errorMessage: any
): string {
  return "Hmmm...There's some issue when " +
    actionText +
    '...\n' +
    'This is what AWS told me:\n' +
    '```' +
    errorMessage + 
    '```';
}
