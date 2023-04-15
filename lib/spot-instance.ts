import type {
  InstanceProps,
  LaunchTemplateSpotOptions
} from 'aws-cdk-lib/aws-ec2';
import { Instance, LaunchTemplate } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface SpotInstanceProps extends InstanceProps {
  readonly templateId: string;
  readonly launchTemplateSpotOptions: LaunchTemplateSpotOptions;
}

export class SpotInstance extends Instance {
  public constructor(scope: Construct, id: string, props: SpotInstanceProps) {
    super(scope, id, props);

    // Make this a spot instance
    const template = new LaunchTemplate(this, props.templateId, {
      spotOptions: props.launchTemplateSpotOptions
    });
    this.instance.launchTemplate = {
      version: template.versionNumber,
      launchTemplateId: template.launchTemplateId
    };
  }
}
