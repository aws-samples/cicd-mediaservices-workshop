// Media Services Definition goes here

import { CfnOutput, Stack } from "aws-cdk-lib";
import { Encoder } from "../media-services/resources/media-live";
import { Packager } from "../media-services/resources/media-package";
import { Cdn } from "../media-services/resources/cloudfront";
import { splitUrlPathFromEmpEndpoint } from "../media-services/helpers/url-processing";
import { Construct } from "constructs";
import { OpsMonitoring } from "../media-services/resources/channel-dashboard";

export class MediaServicesStack extends Stack {
  constructor(scope: Construct) {
    super(scope, "media-stack", {
      env: {
        region: process.env.CDK_DEFAULT_REGION,
        account: process.env.CDK_DEFAULT_ACCOUNT,
      },
    });

    this.medialive.node.addDependency(this.mp);
  }

  // 1. Setup EMP (ready for integrating into EML)
  public mp = new Packager(this);

  // 2. Create EML channel with input and output from steps 1 and 2 respectively
  public medialive = new Encoder(this, {
    mp: this.mp.mp,
  });

  // 3. Add CDN
  public cdn = new Cdn(this, {
    cdnAuthorization: this.mp.cdnOriginAuth.cdnSecret,
    empOriginUrl: this.mp.endpoints.hls.attrUrl,
  }).distribution;

  // 4. Create Monitoring dashboard for your new channel
  public cw = new OpsMonitoring(this, this.medialive.channel.ref, this.mp.mp.ref, this.cdn.distributionId);

  // 5. Outputs
  public outputs = [
    new CfnOutput(this, "hls-endpoint-url", {
      value: `https://${this.cdn.distributionDomainName}/${splitUrlPathFromEmpEndpoint(this.mp.endpoints.hls)}`,
    }),
  ];
}
