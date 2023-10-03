import { CfnOutput, Stack } from "aws-cdk-lib";
import { Role, ServicePrincipal, PolicyStatement, Effect, PolicyDocument } from "aws-cdk-lib/aws-iam";
import { CfnChannel, CfnInput } from "aws-cdk-lib/aws-medialive";
import { CfnChannel as MPCfnChannel } from "aws-cdk-lib/aws-mediapackage";
import { AudioAAC } from "../encoder-settings/audio";
import { MpOutput } from "../encoder-settings/output";
import { MPOutputGroupSettings } from "../encoder-settings/output-group-settings";
import { VideoH264 } from "../encoder-settings/video";
import { DEFAULT_INPUT_STREAM } from "../../workshop-stacks/config/eml-constants";
import { Construct } from "constructs";

export function createMediaLiveRole(scope: Construct, id: string): Role {
  const role = new Role(scope, `role-${id}`, {
    assumedBy: new ServicePrincipal("medialive.amazonaws.com"),
    inlinePolicies: {
      inline: new PolicyDocument({
        statements: [
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
              "s3:ListBucket",
              "s3:PutObject",
              "s3:GetObject",
              "s3:DeleteObject",
              "ec2:DescribeAddresses",
              "mediaconnect:AddFlowOutputs",
              "mediaconnect:ManagedDescribeFlow",
              "ec2:DeleteNetworkInterfacePermission",
              "ec2:DescribeNetworkInterfaces",
              "ec2:CreateNetworkInterfacePermission",
              "mediastore:DeleteObject",
              "mediastore:DescribeObject",
              "mediapackage:DescribeChannel",
              "mediastore:ListContainers",
              "ec2:DeleteNetworkInterface",
              "mediastore:GetObject",
              "mediaconnect:ManagedRemoveOutput",
              "mediaconnect:RemoveFlowOutput",
              "ec2:DescribeSecurityGroups",
              "ec2:CreateNetworkInterface",
              "mediaconnect:DescribeFlow",
              "ec2:DescribeSubnets",
              "ec2:AssociateAddress",
              "mediastore:PutObject",
              "mediaconnect:ManagedAddOutput",
            ],
            resources: ["*"],
          }),
        ],
      }),
    },
  });

  return role;
}

interface IMediaLiveProps {
  mp: MPCfnChannel;
}

/**
 * Construct to build an Encoder; done using MediaLive.
 * Creates a URL PULL input, along with creating the channel itself.
 *
 * Uses `encoder-settings` to generate channel configuration for video, audio and outputs.
 *
 * @see https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_medialive.CfnInput.html
 * @see https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_medialive.CfnChannel.html
 */
export class Encoder extends Construct {
  constructor(private scope: Stack, private props: IMediaLiveProps) {
    super(scope, "encoder");
  }

  /**
   * Creates a channel input
   *
   * @see https://docs.aws.amazon.com/medialive/latest/ug/medialive-inputs.html
   */
  private input = new CfnInput(this, `input`, {
    type: "URL_PULL",
    sources: [
      {
        url: DEFAULT_INPUT_STREAM,
      },
    ],
    name: `L2V-EML-input`,
  });

  private audioSettings = new AudioAAC("myMainAudio", {
    bitrate: 96000,
    codingMode: "CODING_MODE_2_0",
    spec: "MPEG4",
    profile: "LC",
    sampleRate: 48000,
  });

  private HQVideoSettings = new VideoH264("HighQualityVideo", {
    resolution: {
      height: 720,
      width: 1280,
    },
    h264Settings: {
      profile: "HIGH",
      level: "H264_LEVEL_AUTO",
      rateControlMode: "QVBR",
      qvbrQualityLevel: 9,
      adaptiveQuantization: "HIGH",
      bitrate: 2700000,
      maxBitrate: 2700000,
      bufSize: 5400000,
      bufFillPct: 90,
      entropyEncoding: "CABAC",
    },
  });

  private MQVideoSettings = new VideoH264("MediumQualityVideo", {
    resolution: {
      height: 540,
      width: 960,
    },
    h264Settings: {
      profile: "MAIN",
      level: "H264_LEVEL_AUTO",
      rateControlMode: "QVBR",
      qvbrQualityLevel: 8,
      adaptiveQuantization: "HIGH",
      bitrate: 1800000,
      maxBitrate: 1800000,
      bufSize: 3600000,
      bufFillPct: 90,
      entropyEncoding: "CABAC",
    },
  });

  private LQVideoSettings = new VideoH264("LowQualityVideo", {
    resolution: {
      height: 288,
      width: 512,
    },
    h264Settings: {
      profile: "BASELINE",
      level: "H264_LEVEL_AUTO",
      gopNumBFrames: 0,
      rateControlMode: "QVBR",
      qvbrQualityLevel: 6,
      adaptiveQuantization: "HIGH",
      bitrate: 400000,
      maxBitrate: 400000,
      bufSize: 800000,
      bufFillPct: 90,
      entropyEncoding: "CAVLC",
    },
  });

  public output = new MPOutputGroupSettings(this.props.mp);
  public hqOutputSettings = new MpOutput("mpoutputHQ", this.HQVideoSettings.getUniqueId(), this.audioSettings.getUniqueId());
  public mqOutputSettings = new MpOutput("mpoutputMQ", this.MQVideoSettings.getUniqueId(), this.audioSettings.getUniqueId());
  public lqOutputSettings = new MpOutput("mpoutputLQ", this.LQVideoSettings.getUniqueId(), this.audioSettings.getUniqueId());

  public channel = new CfnChannel(this, "channel", {
    name: `${this.scope.stackName}-EML-channel`,
    roleArn: createMediaLiveRole(this, "channel").roleArn,
    encoderSettings: {
      globalConfiguration: {
        inputEndAction: "SWITCH_AND_LOOP_INPUTS",
        outputTimingSource: "SYSTEM_CLOCK",
      },
      audioDescriptions: [this.audioSettings.getAudioProfile()],
      captionDescriptions: [],
      outputGroups: [
        {
          outputGroupSettings: this.output.getOutputGroupSettings(),
          outputs: [this.hqOutputSettings.getOutputSettings(), this.mqOutputSettings.getOutputSettings(), this.lqOutputSettings.getOutputSettings()],
        },
      ],
      timecodeConfig: {
        source: "SYSTEMCLOCK",
      },
      videoDescriptions: [this.HQVideoSettings.getVideoProfile(), this.MQVideoSettings.getVideoProfile(), this.LQVideoSettings.getVideoProfile()],
    },
    channelClass: "SINGLE_PIPELINE",
    inputSpecification: {
      codec: "AVC",
      resolution: "HD",
      maximumBitrate: "MAX_20_MBPS",
    },
    destinations: [
      {
        id: this.props.mp.ref,
        mediaPackageSettings: [
          {
            channelId: this.props.mp.id,
          },
        ],
      },
    ],
    inputAttachments: [
      {
        inputAttachmentName: `input-${this.input.ref}`,
        inputId: this.input.ref,
        inputSettings: {
          sourceEndBehavior: "CONTINUE",
          inputFilter: "AUTO",
          filterStrength: 1,
          deblockFilter: "DISABLED",
          denoiseFilter: "DISABLED",
          smpte2038DataPreference: "IGNORE",
          audioSelectors: [],
          captionSelectors: [],
        },
      },
    ],
  });

  public outputNames = {
    channelName: "eml-channel-name-output",
  };

  public outputs = [
    new CfnOutput(this, "channel-name", {
      value: this.channel.ref,
      exportName: this.outputNames.channelName,
    }),
  ];
}
