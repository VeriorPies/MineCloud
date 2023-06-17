import {
  CdkCustomResourceEvent,
  CdkCustomResourceResponse,
  Context
} from 'aws-lambda';
import axios from 'axios';
import { getFullDiscordCommand } from '../shared_util';

// The deployment will fail if exception was thrown.
exports.handler = async (event: CdkCustomResourceEvent, context: Context) => {
  if (event.RequestType !== 'Delete') {
    const apiEndpoint = `https://discord.com/api/v10/applications/${process.env.APP_ID}/commands`;
    await registerCommand(getFullDiscordCommand('start'), 'Start the server', apiEndpoint);
    await registerCommand(getFullDiscordCommand('stop'), 'Stop the server', apiEndpoint);
    await registerCommand(
      getFullDiscordCommand('restart'),
      'Restart the server system service',
      apiEndpoint
    );
    await registerCommand(
      getFullDiscordCommand('backup'),
      'Stop the server and make a backup',
      apiEndpoint
    );
    await registerCommand(
      getFullDiscordCommand('backup_download'),
      'Get the latest backup',
      apiEndpoint
    );
    console.log('Discord command register completed');
  }

  const response: CdkCustomResourceResponse = {
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    PhysicalResourceId: context.logGroupName
  };

  response.Status = 'SUCCESS';
  response.Data = { Result: 'None' };
  return response;
};

async function registerCommand(
  commandName: string,
  description: string,
  endPoint: string
) {
  const header = {
    Authorization: `Bot ${process.env.BOT_TOKEN}`
  };
  const body = {
    name: commandName,
    type: 1,
    description: description
  };
  const request = {
    method: 'post',
    url: endPoint,
    headers: header,
    data: body
  };

  console.log('register request: ', request);
  const response = await axios(request);
  console.log('register response: ', response.data);
}