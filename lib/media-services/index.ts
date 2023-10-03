import { App, Stage } from "aws-cdk-lib";
import { MediaServicesStack } from "../workshop-stacks/media-services";
import { ProtectServicesStack } from "../workshop-stacks/protect-services";

export class MediaServicesStage extends Stage {
  constructor(app: App) {
    super(app, "workshop");
  }

  private protectStack = new ProtectServicesStack(this);

  public stack = new MediaServicesStack(this, this.protectStack.waf.attrArn);
}
