import { ShellStep, Step } from "aws-cdk-lib/pipelines";
import { PIPELINE_START_CHANNEL_ENABLED, PIPELINE_STOP_CHANNEL_ENABLED } from "../../workshop-stacks/config/pipeline";

export enum SETTING {
  START = "START",
  STOP = "STOP",
}

/**
 * Function to generate a bash script to allow automatic turning off and on of MediaLive channels to help pipeline flow (stop deploy failiures).
 *
 * This is **UNSAFE** if running in production as it could impact your live streams - so other processes and procedures need to be put in place before trying to implement this.
 */
export function generateAutoStopStart(action: SETTING, exportNameForMLChannelName: string) {
  return new ShellStep(`${action} Running EML Channel`, {
    commands: [
      `aws cloudformation describe-stacks --stack-name workshop-media-stack --query 'Stacks[0].Outputs[?ExportName==\`${exportNameForMLChannelName}\`].OutputValue' --output text; ERROR=$?`,
      `if [ "$ERROR" != "0" ];
  then
    echo "Channel Doesn't Exist Yet"
    CODEBUILD_BUILD_SUCCEEDING=1
  else
    EML_CHANNEL_NAME=$(aws cloudformation describe-stacks --stack-name workshop-media-stack --query 'Stacks[0].Outputs[?ExportName==\`${exportNameForMLChannelName}\`].OutputValue' --output text)
    if [ ! -z "$EML_CHANNEL_NAME"  ];
    then
      echo "${action} CHANNEL: $EML_CHANNEL_NAME"
      aws medialive ${action == SETTING.START ? "start-channel" : "stop-channel"} --channel-id "$EML_CHANNEL_NAME"
      aws medialive wait ${action == SETTING.START ? "channel-running" : "channel-stopped"} --channel-id "$EML_CHANNEL_NAME"
    else
      echo "No Channel to ${action} - skipping this step!"
    fi
  fi
  `,
    ],
  });
}

/**
 * Constructs pre & post steps for pipeline
 */
export function createPreAndPostBuildActions(exportNameForMLChannelName: string) {
  const pre: Step[] = [];
  const post: Step[] = [];

  if (PIPELINE_START_CHANNEL_ENABLED) {
    post.push(generateAutoStopStart(SETTING.START, exportNameForMLChannelName));
  }

  if (PIPELINE_STOP_CHANNEL_ENABLED) {
    pre.push(generateAutoStopStart(SETTING.STOP, exportNameForMLChannelName));
  }

  return {
    pre,
    post,
  };
}
