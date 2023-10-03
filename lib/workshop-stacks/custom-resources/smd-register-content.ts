import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId } from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";
import { SMD_VIDEO_ASSET_TABLE_NAME } from "../config/protect-constants";
import { Aws, Fn } from "aws-cdk-lib";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";

interface ISmdRegisterContentProps {
  /**
   * Name of the endpoint - this will be a CloudFront hostname.
   */
  endpointHostname: string;

  /**
   * Main URL (url_path) path in dynamodb table
   */
  urlPathForHls: string;
}

export class SmdRegisterContent extends Construct {
  public readonly response: string;

  constructor(scope: Construct, id: string, private props: ISmdRegisterContentProps) {
    super(scope, id);
  }

  protected updateDynamoDBVideoTableHls = new AwsCustomResource(this, "UpdateDynamoDbTableHls", {
    onUpdate: {
      service: "DynamoDB",
      action: "updateItem",
      parameters: {
        TableName: SMD_VIDEO_ASSET_TABLE_NAME,
        Key: {
          id: {
            S: "1",
          },
        },
        ...createUpdateExpressionObject(this.props),
      },
      region: Aws.REGION,
      physicalResourceId: PhysicalResourceId.of(Date.now().toString()),
    },
    policy: AwsCustomResourcePolicy.fromStatements([
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["dynamodb:UpdateItem"],
        resources: [`*`],
      }),
    ]),
  });
}

interface IUrlPathFields {
  S: string;
}

function parseUrlsToPaths(url: string): IUrlPathFields[] {
  const hashEMT = Fn.select(3, Fn.split("/", url));
  const hashConfigEMT = Fn.select(4, Fn.split("/", url));
  const pathEMP = Fn.select(7, Fn.split("/", url));

  return [
    { S: `/out/v1/${pathEMP}/` },
    { S: `/v1/master/${hashEMT}/${hashConfigEMT}/` },
    { S: `/v1/manifest/${hashEMT}/${hashConfigEMT}/` },
    { S: `/v1/segment/${hashEMT}/${hashConfigEMT}/` },
  ];
}

interface IUpdateExpressionObject {
  UpdateExpression: string;
  ExpressionAttributeValues: unknown;
}

function createUpdateExpressionObject(props: ISmdRegisterContentProps): IUpdateExpressionObject {
  const updateExpressionList = [
    "endpoint_hostname = :hostname",
    "url_path = :urlPaths",
    "token_policy.exc = :excList",
    "token_policy.exp = :expVal",
    "token_policy.headers = :headers",
    "token_policy.paths = :paths",
  ];

  return {
    UpdateExpression: `SET ${updateExpressionList.join(",")}`,
    ExpressionAttributeValues: {
      ":hostname": {
        S: `https://${props.endpointHostname}`,
      },
      ":urlPaths": {
        S: props.urlPathForHls,
      },
      ":excList": {
        L: [
          {
            S: "/ads/",
          },
        ],
      },
      ":expVal": {
        S: "+6h",
      },
      ":headers": {
        L: [{ S: "user-agent" }, { S: "referer" }],
      },
      ":paths": {
        L: parseUrlsToPaths(props.urlPathForHls),
      },
    },
  };
}
