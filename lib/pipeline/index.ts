import { App, Stack } from "aws-cdk-lib";
import { createCodeCommitRepo, createIamUserForCodeCommit } from "./resources/code-commit";
import { CodePipeline, CodePipelineSource, ManualApprovalStep, ShellStep } from "aws-cdk-lib/pipelines";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { BuildSpec } from "aws-cdk-lib/aws-codebuild";
import { createPreAndPostBuildActions } from "./resources/code-build";
import { MediaServicesStage } from "../media-services";
import { PIPELINE_PROD_MANUAL_APPROVAL } from "../workshop-stacks/config/pipeline";

/**
 * Stack to create a self mutating Pipeline(s) for deploying workflows.
 *
 * This creates CodeBuild, the adds the Stages required to deploy the CDK App.
 * It also adds pre and post hooks for stopping & starting the MediaLive channel.
 *
 * @see https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.pipelines.CodePipeline.html
 */
export class PipelineStack extends Stack {
  constructor(app: App, private mediaStage: MediaServicesStage) {
    super(app, "workshop-pipeline-stack (uksb-1tupboc33)", {
      env: {
        region: process.env.CDK_DEFAULT_REGION,
        account: process.env.CDK_DEFAULT_ACCOUNT,
      },
    });
  }

  protected repo = createCodeCommitRepo(this);
  protected user = createIamUserForCodeCommit(this);

  protected pipelines = this.createPipelines();

  createPipelines() {
    const pipeline = new CodePipeline(this, "pipeline", {
      selfMutation: true,
      codeBuildDefaults: {
        partialBuildSpec: BuildSpec.fromObject({
          env: {
            shell: "bash",
          },
        }),
        rolePolicy: [
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ["cloudformation:DescribeStacks", "medialive:DescribeChannel", "medialive:StopChannel", "medialive:StartChannel"],
            resources: ["*"],
          }),
        ],
      },
      synth: new ShellStep("synth", {
        input: CodePipelineSource.codeCommit(this.repo, "main"),
        commands: ["npm install", "npm run cdk synth"],
      }),
    });

    if (PIPELINE_PROD_MANUAL_APPROVAL) {
      const manualApprovalWave = pipeline.addWave("prod-environment-catch");
      manualApprovalWave.addPre(new ManualApprovalStep("prod-environment-catch"));
    }
    pipeline.addStage(this.mediaStage, createPreAndPostBuildActions(this.mediaStage.stack.medialive.outputNames.channelName));
    
    return pipeline;
  }
}
