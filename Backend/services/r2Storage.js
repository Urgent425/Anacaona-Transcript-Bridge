// backend/services/r2Storage.js
const crypto = require("crypto");
const { PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { r2 } = require("../config/r2Client");

function must(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

const BUCKET = must("R2_BUCKET");

function safeName(name = "file") {
  return String(name).replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

function randomHex(bytes = 8) {
  return crypto.randomBytes(bytes).toString("hex");
}

function buildKey({ prefix, requestId, originalName }) {
  const clean = safeName(originalName);
  return `${prefix}/${requestId}/${randomHex(8)}-${clean}`;
}

async function uploadBuffer({ key, buffer, contentType }) {
  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType || "application/octet-stream",
    })
  );
  return { bucket: BUCKET, key };
}

async function signedGetUrl({ key, expiresInSeconds }) {
  const exp = Number(expiresInSeconds || process.env.SIGNED_URL_EXPIRES_SECONDS || 120);
  const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(r2, cmd, { expiresIn: exp });
}

module.exports = { buildKey, uploadBuffer, signedGetUrl };
