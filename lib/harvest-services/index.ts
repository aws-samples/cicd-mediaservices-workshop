import { App, Stage } from "aws-cdk-lib";
import { HarvestStack } from "../workshop-stacks/harvest-services";

export class HarvestApiStage extends Stage {
  constructor(app: App) {
    super(app, "live2vod");
  }

  public harvest = new HarvestStack(this);
}
