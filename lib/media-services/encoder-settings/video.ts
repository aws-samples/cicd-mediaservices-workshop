import { CfnChannel } from "aws-cdk-lib/aws-medialive";
import { Base, OPTIONS } from "./base";

interface IVideo {
  height: number;
  width: number;
}

type H264BaseSettings = Omit<CfnChannel.H264SettingsProperty, "bitrate">;
interface H264Settings extends H264BaseSettings {
  bitrate: number;
}

interface IVideoH264Props {
  resolution: IVideo;
  h264Settings: H264Settings;
}

/**
 * Constructs a VideoDescriptionProperty for a MediaLive Channel.
 *
 * This class defaults to using AVC/H.264 for video settings.
 *
 * @see https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_medialive.CfnChannel.H264SettingsProperty.html
 */
export class VideoH264 extends Base {
  constructor(id: string, private props: IVideoH264Props) {
    super(id, OPTIONS.VIDEO);
  }

  private baseH264Props: H264BaseSettings = {
    framerateControl: "SPECIFIED",
    framerateNumerator: 25,
    framerateDenominator: 1,
    gopSize: 2,
    gopSizeUnits: "SECONDS",
    parControl: "SPECIFIED",
    parNumerator: 1,
    parDenominator: 1,
  };

  /**
   * @see https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_medialive.CfnChannel.VideoDescriptionProperty.html
   * @returns VideoDescriptionProperty
   */
  public getVideoProfile(): CfnChannel.VideoDescriptionProperty {
    return {
      codecSettings: {
        h264Settings: {
          ...this.baseH264Props,
          ...this.props.h264Settings,
        },
      },
      height: this.props.resolution.height,
      name: this.getUniqueId(),
      width: this.props.resolution.width,
    };
  }
}
