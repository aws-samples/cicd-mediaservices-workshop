import { Aws, Duration } from "aws-cdk-lib";
import { Rule } from "aws-cdk-lib/aws-events";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import { Role, ServicePrincipal, ManagedPolicy, PolicyDocument, PolicyStatement, Effect } from "aws-cdk-lib/aws-iam";
import { Code, Function as Fn, Runtime } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";

/**
 * Construct that builds a construct for capturing EventBridge MediaPackage HarvestJob Notifications from when a harvesting requests.
 * This will then trigger a Lambda Function to process the harvesting.
 *
 * @see https://docs.aws.amazon.com/mediapackage/latest/ug/cloudwatch-events-example.html
 */
export class CaptureHarvestComplete extends Construct {
  constructor(scope: Construct, private role: Role, private mpVodPackagingId: string) {
    super(scope, "capture-harvest-complete");
  }

  private harvestCompleteIamRole = new Role(this, "harvest-complete-role", {
    assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
    managedPolicies: [ManagedPolicy.fromManagedPolicyArn(this, "managed-policy", "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole")],
    inlinePolicies: {
      inline: new PolicyDocument({
        statements: [
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ["mediapackage-vod:CreateAsset"],
            resources: [`arn:aws:mediapackage-vod:${Aws.REGION}:${Aws.ACCOUNT_ID}:assets/*`],
          }),
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ["iam:PassRole"],
            resources: [this.role.roleArn],
          }),
        ],
      }),
    },
  });

  private fn = new Fn(this, "harvested-complete-fn", {
    code: Code.fromAsset("./lambdas"),
    handler: "harvest-complete.handler",
    runtime: Runtime.NODEJS_18_X,
    timeout: Duration.seconds(30),
    role: this.harvestCompleteIamRole,
    environment: {
      MP_VOD_PACKAGING_GROUP: this.mpVodPackagingId,
    },
  });

  public rule = new Rule(this, "harvest-complete-rule", {
    eventPattern: {
      source: ["aws.mediapackage"],
      detailType: ["MediaPackage HarvestJob Notification"],
    },
  }).addTarget(
    new LambdaFunction(this.fn, {
      maxEventAge: Duration.hours(2),
      retryAttempts: 2,
    }),
  );
}
