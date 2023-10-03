import { CfnChannel } from "aws-cdk-lib/aws-medialive";
import { Base, OPTIONS } from "./base";

/**
 * Constructs a OutputProperty for a MediaLive Channel.
 * The parent of this entity is OutputGroup.
 *
 * This class defaults to only providing output settings for MediaPackage.
 *
 * @see https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_medialive.CfnChannel.OutputProperty.html
 */
export class MpOutput extends Base {
  constructor(id: string, private videoSettings: string, private audioSettings: string) {
    super(id, OPTIONS.NONE);
  }

  private baseProps: CfnChannel.OutputProperty = {
    outputSettings: {
      mediaPackageOutputSettings: {},
    },
    outputName: this.getUniqueId(),
    videoDescriptionName: this.videoSettings,
    audioDescriptionNames: [this.audioSettings],
    captionDescriptionNames: [],
  };

  /**
   * @see https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_medialive.CfnChannel.OutputProperty.html
   * @returns OutputProperty
   */
  public getOutputSettings(): CfnChannel.OutputProperty {
    return this.baseProps;
  }
}
