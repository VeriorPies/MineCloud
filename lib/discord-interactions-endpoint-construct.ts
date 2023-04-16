import { Construct } from 'constructs/lib/construct';
import { STACK_PREFIX } from './mine-cloud-stack';
import {
  Runtime,
  FunctionUrlAuthType,
  FunctionUrl
} from 'aws-cdk-lib/aws-lambda';
import path = require('path');
import { PolicyStatement, Policy } from 'aws-cdk-lib/aws-iam';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

export interface DiscordInteractionsEndpointConstructProps {
  instanceId: string;
  region: string;
  discordPublicKey: string;
}

export class DiscordInteractionsEndpointConstruct extends Construct {
  readonly lambdaFunction;
  readonly lambdaFunctionURL: FunctionUrl;

  constructor(
    scope: Construct,
    id: string,
    props: DiscordInteractionsEndpointConstructProps
  ) {
    super(scope, id);

    this.lambdaFunction = new NodejsFunction(
      this,
      `${STACK_PREFIX}_discord_interactions_endpoint_lambda`,
      {
        runtime: Runtime.NODEJS_18_X,
        handler: 'index.handler',
        entry: path.join(
          __dirname,
          '/../lambda/discord_interactions_endpoint/index.js'
        ),
        environment: {
          PUBLIC_KEY: props.discordPublicKey,
          INSTANCE_ID: props.instanceId,
          REGION: props.region
        }
      }
    );

    const ec2Policy = new PolicyStatement({
      actions: ['ec2:*'],
      resources: ['arn:aws:ec2:*']
    });

    const ec2SSMPolicy = new PolicyStatement({
      actions: ['ssm:SendCommand'],
      resources: ['*']
    });

    this.lambdaFunction.role?.attachInlinePolicy(
      new Policy(
        this,
        `${STACK_PREFIX}_discord_interactions_endpoint_lambda_policy`,
        {
          statements: [ec2Policy, ec2SSMPolicy]
        }
      )
    );

    this.lambdaFunctionURL = this.lambdaFunction.addFunctionUrl({
      authType: FunctionUrlAuthType.NONE
    });
  }
}