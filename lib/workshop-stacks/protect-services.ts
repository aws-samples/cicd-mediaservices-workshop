import { Stack } from "aws-cdk-lib";
import { CfnWebACL } from "aws-cdk-lib/aws-wafv2";
import { SMD_RULE_GROUP_ARN } from "./config/protect-constants";
import { Construct } from "constructs";

export class ProtectServicesStack extends Stack {
  constructor(scope: Construct) {
    super(scope, "protect-stack", {
      env: {
        region: "us-east-1",
        account: process.env.CDK_DEFAULT_ACCOUNT,
      },
      crossRegionReferences: true,
    });
  }

  public waf = new CfnWebACL(this, "wafv2", {
    defaultAction: {
      allow: {},
    },
    scope: "CLOUDFRONT",
    visibilityConfig: {
      cloudWatchMetricsEnabled: false,
      metricName: "workshopcdnprotect",
      sampledRequestsEnabled: false,
    },
    rules: [
      {
        name: "protect",
        priority: 0,
        visibilityConfig: {
          sampledRequestsEnabled: false,
          cloudWatchMetricsEnabled: false,
          metricName: "workshopcdnprotect",
        },
        statement: {
          ruleGroupReferenceStatement: {
            arn: SMD_RULE_GROUP_ARN,
          },
        },
        overrideAction: {
          none: {},
        },
      },
    ],
  });
}
