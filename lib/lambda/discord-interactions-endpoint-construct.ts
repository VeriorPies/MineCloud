import { Construct } from "constructs/lib/construct";
import { STACK_PREFIX } from "../mine-cloud-stack";
import {Function,Runtime,Code, FunctionUrlAuthType} from "aws-cdk-lib/aws-lambda"
import path = require("path");
import {PolicyStatement, Policy} from 'aws-cdk-lib/aws-iam';

  export interface DiscordInteractionsEndpointConstructProps {
    instanceId: string;
    region: string;
    discordPublicKey: string;
  }
  
  export class DiscordInteractionsEndpointConstruct extends Construct {

    readonly lambdaFunction;

    constructor(scope: Construct, id: string, props: DiscordInteractionsEndpointConstructProps) {
      super(scope, id);
      
      this.lambdaFunction = new Function(this, `${STACK_PREFIX}_discord_interactions_endpoint_lambda`, {
        runtime: Runtime.NODEJS_14_X, // We will want to upgrade this later
        handler: 'index.handler',
        // code: Code.fromAsset(path.join(__dirname, 'index.js')),
        code: Code.fromInline('exports.handler = async (event, context, callback) => {return {status: 200};}'),
        environment:{
          PUBLIC_KEY: props.discordPublicKey,
          INSTANCE_ID: props.instanceId,
          REGION: props.region
        }
      });

      const ec2Policy = new PolicyStatement({
        actions: ['ec2:*'], // We probably will want some more refined access later
        resources: ['arn:aws:ec2:*'],
      });

      this.lambdaFunction.role?.attachInlinePolicy(
        new Policy(this, `${STACK_PREFIX}_discord_interactions_endpoint_lambda_policy`, {
          statements: [ec2Policy],
        }),
      );

      this.lambdaFunction.addFunctionUrl(
        {
          authType: FunctionUrlAuthType.NONE
        }
      );
    }
  }