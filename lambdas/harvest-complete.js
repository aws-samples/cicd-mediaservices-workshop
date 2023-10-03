const { CreateAssetCommand, MediaPackageVodClient } = require("@aws-sdk/client-mediapackage-vod");
const client = new MediaPackageVodClient();

exports.handler = async (event, _context, callback) => {
  const mpVodPackagingGroup = process.env.MP_VOD_PACKAGING_GROUP;
  if (!mpVodPackagingGroup) {
    return callback(null, {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
      },
      body: "Missing MP Packaging Group",
    });
  }

  const harvestJob = event.detail.harvest_job;
  const id = harvestJob.id;
  const status = harvestJob.status;
  const bucketName = harvestJob.s3_destination.bucket_name;
  const manifestKey = harvestJob.s3_destination.manifest_key;
  const roleArn = harvestJob.s3_destination.role_arn;

  if (status == "FAILED") {
    return callback(null, {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
      },
      body: "Harvest Failed",
    });
  }

  const params = {
    Id: id,
    PackagingGroupId: mpVodPackagingGroup,
    SourceArn: `arn:aws:s3:::${bucketName}/${manifestKey}`,
    SourceRoleArn: roleArn,
  };
  const command = new CreateAssetCommand(params);

  try {
    await client.send(command);
    return callback(null, {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
      },
      body: "ok",
    });
  } catch (e) {
    return callback(null, {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
      },
      body: "Something went wrong",
    });
  }
};
