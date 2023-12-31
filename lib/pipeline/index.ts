import { App, Stack } from "aws-cdk-lib";
import { createCodeCommitRepo, createIamUserForCodeCommit } from "./resources/code-commit";
import { CodePipeline, CodePipelineSource, ManualApprovalStep, ShellStep } from "aws-cdk-lib/pipelines";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { BuildSpec } from "aws-cdk-lib/aws-codebuild";

/**
 * Stack to create a self mutating Pipeline(s) for deploying workflows.
 *
 * This creates CodeBuild, the adds the Stages required to deploy the CDK App.
 * It also adds pre and post hooks for stopping & starting the MediaLive channel.
 *
 * @see https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.pipelines.CodePipeline.html
 */
export class PipelineStack extends Stack {
  constructor(app: App) {
    super(app, "workshop-pipeline-stack", {
      description: 'Workshop pipeline stack (uksb-1tupboc33)',
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

    return pipeline;
  }
}
