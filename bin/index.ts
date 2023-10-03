import { App } from "aws-cdk-lib";
import { PipelineStack } from "../lib/pipeline";
import { MediaServicesStage } from "../lib/media-services";
import { HarvestApiStage } from "../lib/harvest-services";

const app = new App();

const ms = new MediaServicesStage(app);
const harvestApi = new HarvestApiStage(app);

// Create Pipeline
new PipelineStack(app, ms, harvestApi);
