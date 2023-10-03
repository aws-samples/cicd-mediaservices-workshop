import { CfnChannel } from "aws-cdk-lib/aws-medialive";
import { CfnChannel as MpChannel } from "aws-cdk-lib/aws-mediapackage";

/**
 * Constructs a OutputGroupSettingsProperty for a MediaLive Channel.
 *
 * This class defaults to only returning MediaPackage Group Settings
 *
 * @see https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_medialive.CfnChannel.MediaPackageGroupSettingsProperty.html
 */
export class MPOutputGroupSettings {
  constructor(private mp: MpChannel) {}

  private baseProps: CfnChannel.OutputGroupSettingsProperty = {
    mediaPackageGroupSettings: {
      destination: {
        destinationRefId: this.mp.ref,
      },
    },
  };

  /**
   * @see https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_medialive.CfnChannel.OutputGroupSettingsProperty.html
   * @returns OutputGroupSettingsProperty
   */
  public getOutputGroupSettings(): CfnChannel.OutputGroupSettingsProperty {
    return {
      ...this.baseProps,
    };
  }
}
