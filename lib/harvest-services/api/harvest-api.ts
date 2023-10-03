import { Aws, Duration } from "aws-cdk-lib";
import { RestApi, Cors, MethodLoggingLevel, LambdaIntegration, AuthorizationType } from "aws-cdk-lib/aws-apigateway";
import { Role, ServicePrincipal, ManagedPolicy, PolicyDocument, PolicyStatement, Effect, AccountPrincipal } from "aws-cdk-lib/aws-iam";
import { Code, Function as Fn, Runtime } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";

/**
 * Construct that builds a RestApi to submit harvesting jobs to.
 *
 * To submit jobs POST the following body:
 * ```
 * {
 * 	"min":"<insert-start-epoch-timestamp>",
 * 	"max":"<insert-end-epoch-timestamp>",
 * 	"originId":"<insert-mediapackage-origin-id>"
 * }
 * ```
 *
 * URL format: `https://<id>.execute-api.eu-west-1.amazonaws.com/prod/harvest`
 *
 * This API is protected by an IAM Role.
 */
export class HarvestApi extends Construct {
  constructor(scope: Construct, private mpRole: Role, private destinationBucketName: string) {
    super(scope, "harvest-api");
  }

  public api = new RestApi(this, "harvest-api", {
    defaultCorsPreflightOptions: {
      allowOrigins: Cors.ALL_ORIGINS,
      allowMethods: Cors.ALL_METHODS,
    },
    cloudWatchRole: true,
    deployOptions: {
      loggingLevel: MethodLoggingLevel.ERROR,
    },
  });

  private harvestIamRole = new Role(this, "harvest-start-role", {
    assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
    managedPolicies: [ManagedPolicy.fromManagedPolicyArn(this, "lambda-managed", "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole")],
    inlinePolicies: {
      inline: new PolicyDocument({
        statements: [
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ["mediapackage:CreateHarvestJob"],
            resources: [`arn:aws:mediapackage:${Aws.REGION}:${Aws.ACCOUNT_ID}:harvest_jobs/*`],
          }),
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ["iam:PassRole"],
            resources: [this.mpRole.roleArn],
          }),
        ],
      }),
    },
  });

  private action = new Fn(this, "start-harvest-fn", {
    code: Code.fromAsset("./lambdas"),
    handler: "start-harvest.handler",
    runtime: Runtime.NODEJS_18_X,
    role: this.harvestIamRole,
    timeout: Duration.seconds(30),
    environment: {
      DESTINATION_BUCKET: this.destinationBucketName,
      HARVEST_ROLE_ARN: this.mpRole.roleArn,
    },
  });

  private method = this.api.root.addResource("harvest").addMethod("POST", new LambdaIntegration(this.action), {
    authorizationType: AuthorizationType.IAM,
  });

  public executeApiRole = new Role(this, "auth-role", {
    assumedBy: new AccountPrincipal(Aws.ACCOUNT_ID),
    inlinePolicies: {
      inline: new PolicyDocument({
        statements: [
          new PolicyStatement({
            actions: ["execute-api:Invoke"],
            effect: Effect.ALLOW,
            resources: [this.method.methodArn],
          }),
        ],
      }),
    },
  });
}
