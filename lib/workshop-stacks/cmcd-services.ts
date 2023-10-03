import { Stack, CfnOutput } from "aws-cdk-lib";
import { Endpoint, RealtimeLogConfig } from "aws-cdk-lib/aws-cloudfront";
import { CMCD_LOG_FIELDS } from "./config/cmcd-constants";
import { Construct } from "constructs";
import { KinesisDataStream } from "../cmcd/input-stream";
import { DeliveryToFireHose } from "../cmcd/delivery-stream";

export class CMCDStack extends Stack {
  constructor(scope: Construct) {
    super(scope, "cmcd-stack", {
      env: {
        region: process.env.CDK_DEFAULT_REGION,
        account: process.env.CDK_DEFAULT_ACCOUNT,
      },
      crossRegionReferences: true,
    });
  }

  public stream = new KinesisDataStream(this);

  /**
   * Creates RealtimeLogConfig in CloudFront resources.
   *
   * @see https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_cloudfront.RealtimeLogConfig.html
   */
  public cfKinesis = new RealtimeLogConfig(this, "subs", {
    endPoints: [Endpoint.fromKinesisStream(this.stream.stream)],
    fields: CMCD_LOG_FIELDS,
    realtimeLogConfigName: "workshop-cmcd-data-collector",
    samplingRate: 100,
  });

  public delivery = new DeliveryToFireHose(this, this.stream.stream);

  public outputNames = {
    cmcdDeliveryStreamArn: "cmcdDeliveryStreamArn",
  };
  public outputs = [
    new CfnOutput(this, "deliveryStreamArn", {
      value: this.delivery.fhd.attrArn,
      exportName: this.outputNames.cmcdDeliveryStreamArn,
    }),
  ];
}
