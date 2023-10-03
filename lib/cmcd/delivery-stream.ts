import { Role, ServicePrincipal, PolicyStatement, Effect, PolicyDocument } from "aws-cdk-lib/aws-iam";
import { Stream } from "aws-cdk-lib/aws-kinesis";
import { CfnDeliveryStream } from "aws-cdk-lib/aws-kinesisfirehose";
import { Bucket, BlockPublicAccess, BucketEncryption } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

/**
 * Constructs a delivery stream from Kinesis to S3 as a destination.
 * This can be altered to deliver to other resources such as OpenSearch, RedShift or a custom HTTP Endpoint.
 *
 * This data is just stored in an S3 bucket - another process would need to be created & invoked to use, manipulate & dashboard this data.
 *
 * @see https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_kinesisfirehose.CfnDeliveryStream.html
 * @see https://aws.amazon.com/blogs/networking-and-content-delivery/improving-video-observability-with-cmcd-and-cloudfront/
 */
export class DeliveryToFireHose extends Construct {
  constructor(scope: Construct, private stream: Stream) {
    super(scope, "firehose-delivery");
  }

  createCMCDBucketRole(bucket: Bucket) {
    const role = new Role(this, "backup-role", {
      assumedBy: new ServicePrincipal("firehose.amazonaws.com"),
    });
    role.addToPrincipalPolicy(
      new PolicyStatement({
        actions: ["s3:*"],
        resources: [bucket.bucketArn, `${bucket.bucketArn}/*`],
        effect: Effect.ALLOW,
      }),
    );

    return role;
  }

  private bucket = new Bucket(this, "cmcd-log-store", {
    blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    encryption: BucketEncryption.S3_MANAGED,
    publicReadAccess: false,
  });

  public cmcdBucketRole = this.createCMCDBucketRole(this.bucket);
  public fireHoseRole = new Role(this, "role-arn", {
    assumedBy: new ServicePrincipal("firehose.amazonaws.com"),
    inlinePolicies: {
      base: new PolicyDocument({
        statements: [
          new PolicyStatement({
            actions: ["kinesis:DescribeStreamSummary", "kinesis:DescribeStream", "kinesis:PutRecord", "kinesis:PutRecords"],
            resources: [this.stream.streamArn],
            effect: Effect.ALLOW,
          }),
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ["logs:PutLogEvents"],
            resources: ["*"],
          }),
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ["s3:*"],
            resources: ["*"],
          }),
        ],
      }),
    },
  });

  public fhd = new CfnDeliveryStream(this, "delivery", {
    deliveryStreamType: "KinesisStreamAsSource",
    kinesisStreamSourceConfiguration: {
      kinesisStreamArn: this.stream.streamArn,
      roleArn: this.fireHoseRole.roleArn,
    },
    s3DestinationConfiguration: {
      bucketArn: this.bucket.bucketArn,
      errorOutputPrefix: "errored",
      roleArn: this.cmcdBucketRole.roleArn,
      bufferingHints: {
        intervalInSeconds: 60,
      },
      prefix: "logs",
      cloudWatchLoggingOptions: {
        enabled: true,
        logGroupName: "cmcd-workshop-logs",
        logStreamName: "cmcd-workshop-logs",
      },
    },
  });
}
