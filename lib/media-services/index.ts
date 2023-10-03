import { App, Stage } from "aws-cdk-lib";
import { MediaServicesStack } from "../workshop-stacks/media-services";
import { CMCDStack } from "../workshop-stacks/cmcd-services";

export class MediaServicesStage extends Stage {
  constructor(app: App) {
    super(app, "workshop");
  }

  public cmcd = new CMCDStack(this);

  public stack = new MediaServicesStack(this, this.cmcd.cfKinesis);
}
