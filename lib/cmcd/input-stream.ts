import { Role, ServicePrincipal, PolicyStatement, Effect } from "aws-cdk-lib/aws-iam";
import { Stream, StreamEncryption, StreamMode } from "aws-cdk-lib/aws-kinesis";
import { Construct } from "constructs";

/**
 * Construct a kinesis stream that can be used by CloudFront to send logs to.
 *
 * @see https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_kinesis.Stream.html
 */
export class KinesisDataStream extends Construct {
  constructor(scope: Construct) {
    super(scope, "kinesis-datastream");
  }

  createRole() {
    const role = new Role(this, "cf-role", {
      assumedBy: new ServicePrincipal("cloudfront.amazonaws.com"),
    });
    role.addToPrincipalPolicy(
      new PolicyStatement({
        actions: [
          "kinesis:DescribeStreamSummary",
          "kinesis:DescribeStream",
          "kinesis:PutRecord",
          "kinesis:PutRecords",
          "kinesis:StartStreamEncryption",
          "kinesis:StopStreamEncryption",
        ],
        resources: [this.stream.streamArn],
        effect: Effect.ALLOW,
      }),
    );
    return role;
  }

  public stream = new Stream(this, "cf-log-flow", {
    encryption: StreamEncryption.MANAGED,
    streamMode: StreamMode.ON_DEMAND,
  });

  public role = this.createRole();
}
