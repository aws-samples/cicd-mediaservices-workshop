import { CfnChannel } from "aws-cdk-lib/aws-medialive";
import { Base, OPTIONS } from "./base";

/**
 * Constructs a AudioDescriptionProperty for a MediaLive Channel.
 *
 * This class defaults to using AAC for audio settings.
 *
 * @see https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_medialive.CfnChannel.Ac3SettingsProperty.html
 */
export class AudioAAC extends Base {
  constructor(id: string, private aacProps?: CfnChannel.AacSettingsProperty) {
    super(id, OPTIONS.AUDIO);
  }

  private baseAacSettings: CfnChannel.AacSettingsProperty = {};

  /**
   * @see https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_medialive.CfnChannel.AudioDescriptionProperty.html
   * @returns AudioDescriptionProperty
   */
  public getAudioProfile(): CfnChannel.AudioDescriptionProperty {
    return {
      codecSettings: {
        aacSettings: {
          ...this.baseAacSettings,
          ...this.aacProps,
        },
      },
      name: this.getUniqueId(),
    };
  }
}
