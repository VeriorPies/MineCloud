import {
    CdkCustomResourceEvent,
    CdkCustomResourceResponse,
    Context,
  } from 'aws-lambda';
import axios from 'axios';

// The deployment will fail if exception was thrown.
exports.handler = async (event: CdkCustomResourceEvent,
    context: Context,) => {
    
    if (event.RequestType !== 'Delete') {
        const apiEndpoint = `https://discord.com/api/v10/applications/${process.env.APP_ID}/commands`;
        await registerCommand("mc_start", "Start the Minecraft server", apiEndpoint);
        await registerCommand("mc_stop", "Stop the Minecraft server", apiEndpoint);
        await registerCommand("mc_restart", "Restart the Minecraft system service", apiEndpoint);
        await registerCommand("mc_backup", "Stop the server and make a backup", apiEndpoint);
        await registerCommand("mc_get_latest_backup", "Get the latest backup zip file", apiEndpoint);
        console.log("Discord command register completed");
    }
   
    const response: CdkCustomResourceResponse = {
        StackId: event.StackId,
        RequestId: event.RequestId,
        LogicalResourceId: event.LogicalResourceId,
        PhysicalResourceId: context.logGroupName,
    };

    response.Status = 'SUCCESS';
    response.Data = { Result: 'None' };
    return response;
}

async function registerCommand(commandName: string, description: string, endPoint: string) {
    const header = {
        "Authorization": `Bot ${process.env.BOT_TOKEN}`
    }
    const body = {
        "name": commandName,
        "type": 1,
        "description": description,
    }
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
