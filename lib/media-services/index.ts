import { App, Stage } from "aws-cdk-lib";
import { MediaServicesStack } from "../workshop-stacks/media-services";

export class MediaServicesStage extends Stage {
  constructor(app: App) {
    super(app, "workshop");
  }

  public stack = new MediaServicesStack(this);
}
