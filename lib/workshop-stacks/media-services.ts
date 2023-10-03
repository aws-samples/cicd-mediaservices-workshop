// Media Services Definition goes here

import { CfnOutput, Stack } from "aws-cdk-lib";
import { Encoder } from "../media-services/resources/media-live";
import { Packager } from "../media-services/resources/media-package";
import { Cdn } from "../media-services/resources/cloudfront";
import { getDomainFromEmtEndpointUrl, splitEmtPathFromUrlPrefix, splitUrlPathFromEmpEndpoint } from "../media-services/helpers/url-processing";
import { Construct } from "constructs";
import { OpsMonitoring } from "../media-services/resources/channel-dashboard";
import { AdInsertion } from "../media-services/resources/media-tailor";
import { EMT_AD_DECISION_SERVER_URL } from "./config/emt-constants";

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

  public adInsertion = new AdInsertion(this, {
    adsUrl: EMT_AD_DECISION_SERVER_URL,
    originUrl: `https://${getDomainFromEmtEndpointUrl(this.mp.endpoints.hls.attrUrl)}`,
  });

  // 3. Add CDN
  public cdn = new Cdn(this, {
    cdnAuthorization: this.mp.cdnOriginAuth.cdnSecret,
    empOriginUrl: this.mp.endpoints.hls.attrUrl,
    emtOriginUrl: this.adInsertion.emt.attrPlaybackEndpointPrefix,
  }).distribution;

  // 4. Create Monitoring dashboard for your new channel
  public cw = new OpsMonitoring(this, this.medialive.channel.ref, this.mp.mp.ref, this.cdn.distributionId);

  // 5. Outputs
  public outputs = [
    new CfnOutput(this, "hls-endpoint-url-ssai", {
      value: `https://${this.cdn.distributionDomainName}/${splitEmtPathFromUrlPrefix(
        this.adInsertion.emt.attrHlsConfigurationManifestEndpointPrefix,
      )}${splitUrlPathFromEmpEndpoint(this.mp.endpoints.hls)}`,
    }),
    new CfnOutput(this, "hls-endpoint-url-ssai-session-init-prefix", {
      value: `https://${this.cdn.distributionDomainName}/${splitEmtPathFromUrlPrefix(
        this.adInsertion.emt.attrSessionInitializationEndpointPrefix,
      )}${splitUrlPathFromEmpEndpoint(this.mp.endpoints.hls)}`,
    }),
  ];
}
