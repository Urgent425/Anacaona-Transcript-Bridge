require("dotenv").config();
const { S3Client, ListBucketsCommand } = require("@aws-sdk/client-s3");

async function main() {
  const accountId = process.env.R2_ACCOUNT_ID;
  if (!accountId) throw new Error("Missing R2_ACCOUNT_ID");

  const client = new S3Client({
    region: process.env.R2_REGION || "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });

  const out = await client.send(new ListBucketsCommand({}));
  console.log("OK ListBuckets:", out);
}

main().catch((e) => {
  console.error("R2 TEST FAILED:", e);
  process.exit(1);
});
