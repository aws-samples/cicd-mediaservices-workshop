const { CreateHarvestJobCommand, MediaPackageClient } = require("@aws-sdk/client-mediapackage");
const cryptoLib = require("crypto");

const client = new MediaPackageClient();

exports.handler = async (event, _context, callback) => {
  if (!event.body) {
    return callback(null, {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
      },
      body: "No Event Body",
    });
  }

  const jsonBody = JSON.parse(event.body);
  const startTime = jsonBody.min;
  const endTime = jsonBody.max;
  const originId = jsonBody.originId;

  if (!startTime || !endTime || !originId) {
    return callback(null, {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
      },
      body: "Missing Harvest Configuration",
    });
  }

  const id = cryptoLib.randomBytes(8).toString("hex");

  const s3Destination = process.env.DESTINATION_BUCKET;
  if (!s3Destination) {
    return callback(null, {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
      },
      body: "Missing S3 Bucket",
    });
  }

  const harvestRoleArn = process.env.HARVEST_ROLE_ARN;
  if (!harvestRoleArn) {
    return callback(null, {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
      },
      body: "Missing Harvest Role ARN",
    });
  }

  const params = {
    Id: id,
    StartTime: startTime,
    EndTime: endTime,
    OriginEndpointId: originId,
    S3Destination: {
      BucketName: s3Destination,
      ManifestKey: `${id}/index.m3u8`,
      RoleArn: harvestRoleArn,
    },
  };

  const command = new CreateHarvestJobCommand(params);

  try {
    const execute = await client.send(command);

    return callback(null, {
      statusCode: 201,
      headers: {
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
      },
      body: execute.Status,
    });
  } catch (e) {
    return callback(null, {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
      },
      body: e.message,
    });
  }
};
