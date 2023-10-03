import { CfnOutput, RemovalPolicy, Stack } from "aws-cdk-lib";
import { CfnChannel, CfnOriginEndpoint, CfnOriginEndpointProps, CfnPackagingConfiguration, CfnPackagingGroup } from "aws-cdk-lib/aws-mediapackage";
import { Construct } from "constructs";
import { CdnOriginAuthorization } from "./cdn-authorization";
import { EMT_AD_TRIGGERS } from "../../workshop-stacks/config/emt-constants";
import { Bucket, BucketEncryption, BlockPublicAccess } from "aws-cdk-lib/aws-s3";

type IEndpointProps = Omit<CfnOriginEndpointProps, "channelId" | "id">;

/**
 * Construct to build a Packager; done using MediaPackage.
 * Creates a channel Origin along with creating Origin Endpoints.
 *
 * `cdn-authorization` is also used on this construct to protect the origin from unauthorized access.
 *
 * @see https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_mediapackage.CfnChannel.html
 */
export class Packager extends Construct {
  constructor(private scope: Stack) {
    super(scope, "packager");

    this.endpoints.hls.node.addDependency(this.mp);
    this.endpoints.dash.node.addDependency(this.mp);
  }

  public cdnOriginAuth = new CdnOriginAuthorization(this);

  private baseCdnAuth: CfnOriginEndpoint.AuthorizationProperty = {
    cdnIdentifierSecret: this.cdnOriginAuth.cdnSecret.secretArn,
    secretsRoleArn: this.cdnOriginAuth.mediaPackageRole.roleArn,
  };

  public mp = new CfnChannel(this, "channel", {
    id: `${this.scope.stackName}-EMP-channel`,
  });

  public endpoints = {
    hls: this.createEndpoint(this, this.mp, "hls", {
      hlsPackage: {
        adTriggers: EMT_AD_TRIGGERS,
        adMarkers: "PASSTHROUGH",
      },
      authorization: this.baseCdnAuth,
      startoverWindowSeconds: 1209600,
    }),
    dash: this.createEndpoint(this, this.mp, "dash", {
      dashPackage: {
        adTriggers: EMT_AD_TRIGGERS,
      },
      authorization: this.baseCdnAuth,
    }),
  };

  /**
   * @see https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_mediapackage.CfnOriginEndpoint.html
   */
  private createEndpoint(scope: Construct, mp: CfnChannel, name: string, props: IEndpointProps) {
    const baseConfiguration: CfnOriginEndpointProps = {
      channelId: mp.id,
      id: `EMP-${name}-output`,
    };
    return new CfnOriginEndpoint(scope, `endpoint-${name}`, {
      ...baseConfiguration,
      ...props,
    });
  }

  public outputNames = {
    hlsEndpointName: "emp-arn-output",
  };

  protected outputs = [
    new CfnOutput(this, "hls-endpoint-arn-output", {
      value: this.mp.attrArn,
      exportName: this.outputNames.hlsEndpointName,
    }),
  ];
}

export class MediaPackageVoDGroup extends Construct {
  constructor(scope: Construct) {
    super(scope, "vod-group");

    this.mpVod.addDependency(this.mp);
  }

  public mp = new CfnPackagingGroup(this, "mp-packaging-group", {
    id: `workshop-EMP-packaging-group`,
  });

  public mpVod = new CfnPackagingConfiguration(this, "mp-packaging-configuration", {
    id: `workshop-EMP-hls-packaging-config`,
    packagingGroupId: this.mp.id,
    hlsPackage: {
      hlsManifests: [
        {
          manifestName: "index",
        },
      ],
    },
  });

  public bucket = new Bucket(this, "harvest-origin", {
    encryption: BucketEncryption.S3_MANAGED,
    blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    removalPolicy: RemovalPolicy.DESTROY,
  });
}
