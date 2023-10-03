import { Duration, Fn } from "aws-cdk-lib";
import {
  AllowedMethods,
  CachePolicy,
  Distribution,
  OriginProtocolPolicy,
  OriginSslPolicy,
  ResponseHeadersPolicy,
  ViewerProtocolPolicy,
} from "aws-cdk-lib/aws-cloudfront";
import { HttpOrigin } from "aws-cdk-lib/aws-cloudfront-origins";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";

interface ICreateMediaCdn {
  empOriginUrl: string;
  cdnAuthorization: Secret;
}

const errorResponse = [400, 403, 404, 405, 414, 416, 500, 501, 502, 503, 504];
const errorDuration = Duration.seconds(1);

/**
 * Construct to build a CloudFront Distribution.
 *
 * @see https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_cloudfront.Distribution.html
 */
export class Cdn extends Construct {
  constructor(scope: Construct, private props: ICreateMediaCdn) {
    super(scope, "cdn");
  }

  public distribution = new Distribution(this, "cdn", {
    errorResponses: errorResponse.map((errorCode) => {
      return {
        httpStatus: errorCode,
        ttl: errorDuration,
      };
    }),
    defaultBehavior: {
      origin: new HttpOrigin(`${Fn.select(2, Fn.split("/", this.props.empOriginUrl))}`, {
        customHeaders: {
          "X-MediaPackage-CDNIdentifier": this.props.cdnAuthorization.secretValueFromJson("MediaPackageCDNIdentifier").unsafeUnwrap().toString(),
        },
        originSslProtocols: [OriginSslPolicy.TLS_V1_2],
        protocolPolicy: OriginProtocolPolicy.HTTPS_ONLY,
      }),
      cachePolicy: CachePolicy.ELEMENTAL_MEDIA_PACKAGE,
      allowedMethods: AllowedMethods.ALLOW_GET_HEAD,
      viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      responseHeadersPolicy: ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS_WITH_PREFLIGHT,
    },
  });
}
