import { App } from "aws-cdk-lib";
import { PipelineStack } from "../lib/pipeline";

const app = new App();

// Create Pipeline
new PipelineStack(app);
