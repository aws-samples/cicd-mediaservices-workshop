import { CfnOutput, Stack } from "aws-cdk-lib";
import { Role, PolicyStatement, Effect, PolicyDocument, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { MediaPackageVoDGroup } from "../media-services/resources/media-package";
import { CaptureHarvestComplete } from "../harvest-services/api/complete-harvest";
import { HarvestApi } from "../harvest-services/api/harvest-api";

export class HarvestStack extends Stack {
  constructor(scope: Construct) {
    super(scope, "harvest-stack", {
      env: {
        region: process.env.CDK_DEFAULT_REGION,
        account: process.env.CDK_DEFAULT_ACCOUNT,
      },
      crossRegionReferences: true,
    });
  }

  public empVoDOriginGroup = new MediaPackageVoDGroup(this);

  private harvestIamMpRole = new Role(this, "harvest-mp-role", {
    assumedBy: new ServicePrincipal("mediapackage.amazonaws.com"),
    inlinePolicies: {
      inline: new PolicyDocument({
        statements: [
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ["s3:PutObject", "s3:GetObject", "s3:ListBucket", "s3:GetBucketLocation", "s3:GetBucketRequestPayment"],
            resources: [this.empVoDOriginGroup.bucket.bucketArn, `${this.empVoDOriginGroup.bucket.bucketArn}/*`],
          }),
        ],
      }),
    },
  });

  public harvestApi = new HarvestApi(this, this.harvestIamMpRole, this.empVoDOriginGroup.bucket.bucketName);
  public harvestComplete = new CaptureHarvestComplete(this, this.harvestIamMpRole, this.empVoDOriginGroup.mp.id);

  public outputs = [
    new CfnOutput(this, "harvest-api-endpoint-output", {
      exportName: `${this.stackName}-harvest-api-endpoint`,
      value: `${this.harvestApi.api.url}harvest`,
    }),
    new CfnOutput(this, "harvest-api-role", {
      exportName: `${this.stackName}-harvest-api-role`,
      value: this.harvestApi.executeApiRole.roleArn,
    }),
  ];
}
