// backend/config/r2Client.js
const { S3Client } = require("@aws-sdk/client-s3");

function must(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

const accountId = must("R2_ACCOUNT_ID");

const r2 = new S3Client({
  region: process.env.R2_REGION || "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: must("R2_ACCESS_KEY_ID"),
    secretAccessKey: must("R2_SECRET_ACCESS_KEY"),
  },
});

module.exports = { r2 };
