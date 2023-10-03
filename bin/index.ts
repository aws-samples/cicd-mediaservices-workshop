import { App } from "aws-cdk-lib";
import { PipelineStack } from "../lib/pipeline";
import { MediaServicesStage } from "../lib/media-services";

const app = new App();

const ms = new MediaServicesStage(app);

// Create Pipeline
new PipelineStack(app, ms);
