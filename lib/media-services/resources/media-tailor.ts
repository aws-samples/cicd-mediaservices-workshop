import { Aws, CfnOutput } from "aws-cdk-lib";
import { CfnPlaybackConfiguration } from "aws-cdk-lib/aws-mediatailor";
import { Construct } from "constructs";

interface IMediaTailorConfig {
  adsUrl: string;
  originUrl: string;
}

/**
 * Adds a new playback configuration with MediaTailor.
 *
 * Sets your content source, CDN configuration (i.e. for relative paths) and other manifest processing rules.
 *
 * @see https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_mediatailor.CfnPlaybackConfiguration.html
 */
export class AdInsertion extends Construct {
  constructor(scope: Construct, private props: IMediaTailorConfig) {
    super(scope, "ad-insertion");
  }

  public emt = new CfnPlaybackConfiguration(this, "emt", {
    adDecisionServerUrl: this.props.adsUrl,
    name: `${Aws.STACK_NAME}-EMT-config`,
    videoContentSourceUrl: this.props.originUrl,
    cdnConfiguration: {
      contentSegmentUrlPrefix: "../../../../../",
      adSegmentUrlPrefix: "../../../../../../../",
    },
    manifestProcessingRules: {
      adMarkerPassthrough: {
        enabled: true,
      },
    },
  });

  public outputNames = {};
  public outputs = [
    new CfnOutput(this, "something", {
      value: this.emt.adDecisionServerUrl,
    }),
  ];
}
