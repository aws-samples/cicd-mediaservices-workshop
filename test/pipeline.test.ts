import { App } from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import { PipelineStack } from "../lib/pipeline";

test("CodePipeline Created with source, build & mutation stages", () => {
  const app = new App();
  const stack = new PipelineStack(app);

  Template.fromStack(stack).hasResourceProperties("AWS::CodePipeline::Pipeline", {
    Stages: Match.arrayWith([
      Match.objectLike({
        Name: "Source",
        Actions: [
          {
            ActionTypeId: {
              Category: "Source",
              Owner: "AWS",
              Provider: "CodeCommit",
            },
          },
        ],
      }),
      Match.objectLike({
        Name: "Build",
        Actions: [
          {
            ActionTypeId: {
              Category: "Build",
              Owner: "AWS",
              Provider: "CodeBuild",
            },
          },
        ],
      }),
      Match.objectLike({
        Name: "UpdatePipeline",
        Actions: [
          {
            ActionTypeId: {
              Category: "Build",
              Owner: "AWS",
              Provider: "CodeBuild",
            },
          },
        ],
      }),
    ]),
  });
});

test("CodeBuild project created for CDK project Synth", () => {
  const app = new App();
  const stack = new PipelineStack(app);

  Template.fromStack(stack).hasResourceProperties("AWS::CodeBuild::Project", {
    Environment: {
      ComputeType: "BUILD_GENERAL1_SMALL",
      Image: "aws/codebuild/standard:7.0",
      ImagePullCredentialsType: "CODEBUILD",
      PrivilegedMode: false,
      Type: "LINUX_CONTAINER",
    },
    Description: "Pipeline step workshop-pipeline-stack/Pipeline/Build/synth",
    Source: {
      BuildSpec:
        '{\n  "env": {\n    "shell": "bash"\n  },\n  "version": "0.2",\n  "phases": {\n    "build": {\n      "commands": [\n        "npm install",\n        "npm run cdk synth"\n      ]\n    }\n  },\n  "artifacts": {\n    "base-directory": "cdk.out",\n    "files": [\n      "**/*"\n    ]\n  }\n}',
      Type: "CODEPIPELINE",
    },
  });
});

test("CodeBuild project created for CodePipeline Mutation", () => {
  const app = new App();
  const stack = new PipelineStack(app);

  Template.fromStack(stack).hasResourceProperties("AWS::CodeBuild::Project", {
    Environment: {
      ComputeType: "BUILD_GENERAL1_SMALL",
      Image: "aws/codebuild/standard:7.0",
      ImagePullCredentialsType: "CODEBUILD",
      PrivilegedMode: false,
      Type: "LINUX_CONTAINER",
    },
    Description: "Pipeline step workshop-pipeline-stack/Pipeline/UpdatePipeline/SelfMutate",
  });
});

test("CodeCommit Created with pipeline", () => {
  const app = new App();
  const stack = new PipelineStack(app);

  Template.fromStack(stack).hasResourceProperties("AWS::CodeCommit::Repository", {
    RepositoryName: "live-streaming-workshop-repository",
  });
});

test("IAM User for CodeCommit created with AWSCodeCommitPowerUser permissions", () => {
  const app = new App();
  const stack = new PipelineStack(app);

  Template.fromStack(stack).hasResourceProperties("AWS::IAM::User", {
    ManagedPolicyArns: [
      {
        "Fn::Join": ["", ["arn:", { Ref: "AWS::Partition" }, ":iam::aws:policy/AWSCodeCommitPowerUser"]],
      },
    ],
  });
});
