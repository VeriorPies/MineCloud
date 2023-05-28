import { Context } from 'aws-lambda';
import { sign } from 'tweetnacl';
import { Lambda } from 'aws-sdk';

exports.handler = async (event: any, context: Context) => {
  const PUBLIC_KEY = process.env.PUBLIC_KEY!;

  const signature = event.headers['x-signature-ed25519'];
  const timestamp = event.headers['x-signature-timestamp'];
  const eventBody = event.body;
  console.log('eventBody: ', eventBody);

  // Checking signature (1st requirment)
  // Public key can be found in Discord dev portal
  const isVerified = sign.detached.verify(
    Buffer.from(timestamp + eventBody),
    Buffer.from(signature, 'hex'),
    Buffer.from(PUBLIC_KEY, 'hex')
  );
  if (!isVerified) {
    return {
      statusCode: 401,
      body: JSON.stringify('invalid request signature')
    };
  }

  const body = JSON.parse(eventBody);

  // Replying to ping (2nd requirment)
  if (body.type == 1) {
    return {
      statusCode: 200,
      body: JSON.stringify({ type: 1 })
    };
  }
  const lambda = new Lambda();
  const res = await lambda
    .invokeAsync({
      FunctionName: process.env.DISCORD_COMMAND_PROCESSOR_FUNCTION_NAME!,
      InvokeArgs: JSON.stringify(event)
    })
    .promise();
  console.log('Command processing lambda invoking result: ', res);

  return JSON.stringify({
    type: 5
  });
};
