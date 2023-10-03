import { Construct } from "constructs";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Aws, CfnOutput, Duration } from "aws-cdk-lib";
import { PolicyDocument, PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";

/**
 * Construct to create resources needed for doing CDN Authorization.
 *
 * 1. Creates Role to be assumed by MediaPackage along with a custom Policy for CDN Authorization.
 *
 * 2. Creates a secret in SecretsManager to be used for CDN Authorization between CDN and MediaPackage.
 *
 * @see - https://docs.aws.amazon.com/mediapackage/latest/ug/cdn-auth.html
 */
export class CdnOriginAuthorization extends Construct {
  constructor(scope: Construct) {
    super(scope, "cdn-origin-auth");

    this.mediaPackageRole.node.addDependency(this.cdnSecret);
  }

  public cdnSecret = new Secret(this, "cdn-secret", {
    secretName: `MediaPackage/${Aws.STACK_NAME}`,
    description: "Secret for Secure Resilient Live Streaming Delivery",
    generateSecretString: {
      secretStringTemplate: JSON.stringify({ MediaPackageCDNIdentifier: "" }),
      generateStringKey: "MediaPackageCDNIdentifier", //MUST keep this StringKey to use with EMP
    },
  });

  public mediaPackageRole = new Role(this, "channel-role", {
    description: "A role to be assumed by MediaPackage",
    assumedBy: new ServicePrincipal("mediapackage.amazonaws.com"),
    inlinePolicies: {
      policy: new PolicyDocument({
        statements: [
          new PolicyStatement({
            resources: [this.cdnSecret.secretArn],
            actions: ["secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret", "secretsmanager:ListSecrets", "secretsmanager:ListSecretVersionIds"],
          }),
        ],
      }),
    },
    maxSessionDuration: Duration.hours(1),
  });

  public outputs = [
    new CfnOutput(this, "cdnSecret", {
      value: this.cdnSecret.secretName,
      exportName: Aws.STACK_NAME + "cdnSecret",
      description: "The name of the cdnSecret",
    }),
  ];
}
