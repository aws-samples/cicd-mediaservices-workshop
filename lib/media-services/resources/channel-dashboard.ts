import { CfnOutput, Duration, Stack } from "aws-cdk-lib";
import { Dashboard, GraphWidget, MathExpression, Metric, SingleValueWidget, TextWidget } from "aws-cdk-lib/aws-cloudwatch";
import { Construct } from "constructs";

/**
 * Construct to build operational monitoring for the live workstream
 *
 * Uses CloudWatch Dashboards, Metrics & Widgets to give an overview of how your live stream is performing.
 *
 * @see https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_cloudwatch.Dashboard.html
 */
export class OpsMonitoring extends Construct {
  constructor(private scope: Stack, private emlChannelId: string, private empChannelId: string, private distributionId: string) {
    super(scope, "ops-monitoring");
  }

  private emlActiveAlertsWidget = new SingleValueWidget({
    height: 4,
    width: 12,
    metrics: [
      new MathExpression({
        expression: `SELECT MAX(ActiveAlerts) FROM MediaLive WHERE ChannelId = '${this.emlChannelId}' GROUP BY Pipeline`,
        searchRegion: this.scope.region,
        period: Duration.minutes(1),
        label: `Pipeline`,
      }),
    ],
    region: this.scope.region,
    title: `EML Active Alerts`,
    sparkline: true,
    setPeriodToTimeRange: false,
    fullPrecision: false,
  });

  private emlPrimaryInputActiveWidget = new SingleValueWidget({
    height: 4,
    width: 12,
    metrics: [
      new MathExpression({
        expression: `SELECT MIN(PrimaryInputActive) FROM "AWS/MediaLive" WHERE ChannelId='${this.emlChannelId}' GROUP BY Pipeline`,
        searchRegion: this.scope.region,
        period: Duration.minutes(1),
        label: `Pipeline`,
      }),
    ],
    region: this.scope.region,
    title: `PrimaryInputActive`,
    sparkline: true,
    setPeriodToTimeRange: false,
    fullPrecision: false,
  });

  private emlNetworkInGraph = new GraphWidget({
    height: 6,
    width: 12,
    left: [
      new MathExpression({
        expression: `SELECT MAX(NetworkIn) FROM SCHEMA("AWS/MediaLive", ChannelId,Pipeline) WHERE ChannelId = '${this.emlChannelId}' GROUP BY Pipeline`,
        searchRegion: this.scope.region,
        period: Duration.minutes(1),
        label: `Pipeline`,
      }),
    ],
    stacked: true,
    region: this.scope.region,
    title: `EML Network In`,
    setPeriodToTimeRange: true,
    period: Duration.minutes(1),
    liveData: true,
  });

  private emlNetworkOutGraph = new GraphWidget({
    height: 6,
    width: 12,
    left: [
      new MathExpression({
        expression: `SELECT MAX(NetworkOut) FROM SCHEMA("AWS/MediaLive", ChannelId,Pipeline) WHERE ChannelId = '${this.emlChannelId}' GROUP BY Pipeline`,
        searchRegion: this.scope.region,
        period: Duration.minutes(1),
        label: `Pipeline`,
      }),
    ],
    stacked: true,
    region: this.scope.region,
    title: `EML Network Out`,
    setPeriodToTimeRange: true,
    period: Duration.minutes(1),
    liveData: true,
  });

  private emlInputFrameRateGraph = new GraphWidget({
    height: 6,
    width: 12,
    left: [
      new MathExpression({
        expression: `SELECT MAX(InputVideoFrameRate) FROM MediaLive WHERE ChannelId='${this.emlChannelId}' GROUP BY Pipeline`,
        searchRegion: this.scope.region,
        period: Duration.minutes(1),
        label: ``,
      }),
    ],
    region: this.scope.region,
    title: `Input Frame Rate`,
    setPeriodToTimeRange: true,
    period: Duration.minutes(1),
  });
  private emlActiveInputsGraph = new GraphWidget({
    height: 6,
    width: 12,
    left: [
      new MathExpression({
        expression: `SELECT MIN(ActiveOutputs) FROM MediaLive WHERE ChannelId='${this.emlChannelId}' GROUP BY OutputGroupName, Pipeline`,
        searchRegion: this.scope.region,
        period: Duration.minutes(1),
        label: ``,
      }),
    ],
    region: this.scope.region,
    title: `Active Outputs`,
    setPeriodToTimeRange: true,
    period: Duration.minutes(1),
  });

  private emlRequest4xxGraph = new GraphWidget({
    height: 6,
    width: 12,
    left: [
      new MathExpression({
        expression: `SELECT SUM(Output4xxErrors) FROM MediaLive WHERE ChannelId = '${this.emlChannelId}' GROUP BY OutputGroupName, Pipeline`,
        searchRegion: this.scope.region,
        period: Duration.minutes(1),
        label: ``,
      }),
    ],
    region: this.scope.region,
    title: `Output 4xx (HLS/EMP Outputs)`,
    setPeriodToTimeRange: true,
    period: Duration.minutes(1),
  });

  private emlRequest5xxGraph = new GraphWidget({
    height: 6,
    width: 12,
    left: [
      new MathExpression({
        expression: `SELECT SUM(Output5xxErrors) FROM MediaLive WHERE ChannelId = '${this.emlChannelId}' GROUP BY OutputGroupName, Pipeline`,
        searchRegion: this.scope.region,
        period: Duration.minutes(1),
        label: ``,
      }),
    ],
    region: this.scope.region,
    title: `Output 5xx (HLS/EMP Outputs)`,
    setPeriodToTimeRange: true,
    period: Duration.minutes(1),
  });

  private emlSvqTimeGraph = new GraphWidget({
    height: 6,
    width: 6,
    left: [
      new MathExpression({
        expression: `SELECT MAX(SvqTime) FROM MediaLive WHERE ChannelId='${this.emlChannelId}' GROUP BY Pipeline`,
        searchRegion: this.scope.region,
        period: Duration.minutes(1),
        label: ``,
      }),
    ],
    region: this.scope.region,
    title: `Svq Time`,
    setPeriodToTimeRange: true,
    period: Duration.minutes(1),
  });

  private emlFillMSecTimeGraph = new GraphWidget({
    height: 6,
    width: 6,
    left: [
      new MathExpression({
        expression: `SELECT MAX(FillMsec) FROM SCHEMA("AWS/MediaLive", ChannelId,Pipeline) WHERE ChannelId = '${this.emlChannelId}' GROUP BY Pipeline`,
        searchRegion: this.scope.region,
        period: Duration.minutes(1),
        label: ``,
      }),
    ],
    region: this.scope.region,
    title: `Fill MSec`,
    setPeriodToTimeRange: true,
    period: Duration.minutes(1),
  });

  private emlInputLossSecondsTimeGraph = new GraphWidget({
    height: 6,
    width: 6,
    left: [
      new MathExpression({
        expression: `SELECT SUM(InputLossSeconds) FROM MediaLive WHERE ChannelId='${this.emlChannelId}' GROUP BY Pipeline`,
        searchRegion: this.scope.region,
        period: Duration.minutes(1),
        label: `Pipeline`,
      }),
    ],
    region: this.scope.region,
    title: `Input Loss Seconds`,
    setPeriodToTimeRange: true,
    period: Duration.minutes(1),
  });

  private emlDroppedFramesTimeGraph = new GraphWidget({
    height: 6,
    width: 6,
    left: [
      new MathExpression({
        expression: `SELECT SUM(DroppedFrames) FROM MediaLive WHERE ChannelId='${this.emlChannelId}' GROUP BY Pipeline`,
        searchRegion: this.scope.region,
        period: Duration.minutes(1),
        label: `Pipeline`,
      }),
    ],
    region: this.scope.region,
    title: `Dropped Frames`,
    setPeriodToTimeRange: true,
    period: Duration.minutes(1),
  });

  private metric = new Metric({
    namespace: `AWS/MediaPackage`,
    metricName: `EgressBytes`,
    dimensionsMap: {
      Channel: this.empChannelId,
    },
    period: Duration.minutes(1),
    statistic: "Sum",
  });

  private metricIngress = new Metric({
    namespace: `AWS/MediaPackage`,
    metricName: `IngressBytes`,
    dimensionsMap: {
      Channel: this.empChannelId,
    },
    period: Duration.minutes(1),
    statistic: "Sum",
  });

  private empEgressRequestsGraph = new GraphWidget({
    height: 6,
    width: 12,
    left: [this.metric, this.metricIngress],
    region: this.scope.region,
    title: `Egress and Ingress Request`,
    setPeriodToTimeRange: true,
    period: Duration.minutes(1),
    statistic: "Sum",
  });

  private metricEgressRequestCount2xx = new Metric({
    namespace: `AWS/MediaPackage`,
    metricName: `EgressRequestCount`,
    dimensionsMap: {
      Channel: `${this.empChannelId}`,
      StatusCodeRange: "2xx",
    },
  });
  private metricEgressRequestCount4xx = new Metric({
    namespace: `AWS/MediaPackage`,
    metricName: `EgressRequestCount`,
    dimensionsMap: {
      Channel: `${this.empChannelId}`,
      StatusCodeRange: "2xx",
    },
  });

  private empEgressByEndpoint = new GraphWidget({
    height: 6,
    width: 12,
    left: [
      new MathExpression({
        expression: `SELECT SUM(EgressBytes) FROM SCHEMA("AWS/MediaPackage", Channel,OriginEndpoint) WHERE Channel='${this.empChannelId}' GROUP BY OriginEndpoint`,
        searchRegion: this.scope.region,
        period: Duration.minutes(1),
        label: ``,
      }),
    ],
    region: this.scope.region,
    title: `Egress bytes per endpoint`,
    setPeriodToTimeRange: true,
    period: Duration.minutes(1),
  });

  private empEgressRequestCountGraph = new GraphWidget({
    height: 6,
    width: 12,
    left: [this.metricEgressRequestCount2xx, this.metricEgressRequestCount4xx],
    region: this.scope.region,
    title: `Egress Requests`,
    setPeriodToTimeRange: true,
    period: Duration.minutes(1),
    statistic: "Sum",
  });

  private cfSumRequestsMetric = new Metric({
    namespace: `AWS/CloudFront`,
    metricName: `Requests`,
    dimensionsMap: {
      DistributionId: this.distributionId,
      Region: "Global",
    },
    period: Duration.minutes(1),
    statistic: "Sum",
  });

  private cfRequestSums = new GraphWidget({
    height: 6,
    width: 12,
    left: [this.cfSumRequestsMetric],
    region: "us-east-1", // Has to be us-east-1
    title: `Requests (sum)`,
    setPeriodToTimeRange: true,
    period: Duration.minutes(1),
  });

  private cfByteUploadedSum = new Metric({
    namespace: `AWS/CloudFront`,
    metricName: `BytesUploaded`,
    dimensionsMap: {
      DistributionId: this.distributionId,
      Region: "Global",
    },
    period: Duration.minutes(1),
    statistic: "Sum",
  });

  private cfByteDownloadedSum = new Metric({
    namespace: `AWS/CloudFront`,
    metricName: `BytesDownloaded`,
    dimensionsMap: {
      DistributionId: this.distributionId,
      Region: "Global",
    },
    period: Duration.minutes(1),
    statistic: "Sum",
  });

  private cfDataTransfer = new GraphWidget({
    height: 6,
    width: 12,
    left: [this.cfByteUploadedSum, this.cfByteDownloadedSum],
    region: "us-east-1", // Has to be us-east-1
    title: `Data Transfer`,
    setPeriodToTimeRange: true,
    period: Duration.minutes(1),
  });

  private cfErrorRate = new GraphWidget({
    height: 6,
    width: 12,
    left: [
      new Metric({
        namespace: `AWS/CloudFront`,
        metricName: `TotalErrorRate`,
        dimensionsMap: {
          DistributionId: this.distributionId,
          Region: "Global",
        },
        period: Duration.minutes(5),
        statistic: "Average",
      }),
      new Metric({
        namespace: `AWS/CloudFront`,
        metricName: `Total4xxErrors`,
        dimensionsMap: {
          DistributionId: this.distributionId,
          Region: "Global",
        },
        period: Duration.minutes(5),
        statistic: "Average",
      }),
      new Metric({
        namespace: `AWS/CloudFront`,
        metricName: `Total5xxErrors`,
        dimensionsMap: {
          DistributionId: this.distributionId,
          Region: "Global",
        },
        period: Duration.minutes(5),
        statistic: "Average",
      }),
    ],
    region: "us-east-1", // Has to be us-east-1
    title: `Error Rate (as a percentage of total requests)`,
    setPeriodToTimeRange: true,
    period: Duration.minutes(1),
  });

  private dashboard = new Dashboard(this, "dashboard", {
    widgets: [
      [
        new TextWidget({
          markdown: `# EML Channel ${this.emlChannelId}`,
          width: 24,
        }),
      ],
      [this.emlActiveAlertsWidget, this.emlPrimaryInputActiveWidget],
      [this.emlNetworkInGraph, this.emlNetworkOutGraph],
      [this.emlRequest4xxGraph, this.emlRequest5xxGraph],
      [this.emlInputFrameRateGraph, this.emlActiveInputsGraph],
      [this.emlInputLossSecondsTimeGraph, this.emlSvqTimeGraph, this.emlFillMSecTimeGraph, this.emlDroppedFramesTimeGraph],
      [
        new TextWidget({
          markdown: `# EMP Channel ${this.empChannelId}`,
          width: 24,
        }),
      ],
      [this.empEgressRequestsGraph, this.empEgressRequestCountGraph],
      [this.empEgressByEndpoint],
      [
        new TextWidget({
          markdown: `# CloudFront ${this.distributionId}`,
          width: 24,
        }),
      ],
      [this.cfRequestSums, this.cfDataTransfer],
      [this.cfErrorRate],
    ],
  });

  public outputs = [
    new CfnOutput(this, "monitoring-dashboard-name", {
      value: this.dashboard.dashboardName,
    }),
  ];
}
