/* eslint-disable */
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");

function getEnv(name, fallback = "") {
  return process.env[name] || fallback;
}

function isEnabled() {
  return !!(process.env.DO_SPACES_KEY && process.env.DO_SPACES_SECRET && process.env.DO_SPACES_BUCKET);
}

function makeClient() {
  const region = getEnv("DO_SPACES_REGION", "fra1");
  const endpoint = getEnv("DO_SPACES_ENDPOINT", "https://fra1.digitaloceanspaces.com");

  return new S3Client({
    region,
    endpoint,
    credentials: {
      accessKeyId: process.env.DO_SPACES_KEY,
      secretAccessKey: process.env.DO_SPACES_SECRET,
    },
  });
}

function publicUrlForKey(key) {
  // Prefer CDN if provided
  const cdn = getEnv("DO_SPACES_CDN", "");
  if (cdn) return `${cdn.replace(/\/$/, "")}/${key}`;
  // else origin bucket URL style
  const bucket = process.env.DO_SPACES_BUCKET;
  const endpoint = getEnv("DO_SPACES_ENDPOINT", "https://fra1.digitaloceanspaces.com");
  return `${endpoint.replace(/\/$/, "")}/${bucket}/${key}`;
}

/**
 * Upload object (public-read). Returns { key, url }
 */
async function uploadObject(key, buffer, contentType) {
  if (!isEnabled()) return { key, url: null };

  const Bucket = process.env.DO_SPACES_BUCKET;
  const client = makeClient();

  await client.send(
    new PutObjectCommand({
      Bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType || "application/octet-stream",
      ACL: "public-read", // works for Spaces
    })
  );

  return { key, url: publicUrlForKey(key) };
}

async function deleteObject(key) {
  if (!isEnabled()) return true;

  const Bucket = process.env.DO_SPACES_BUCKET;
  const client = makeClient();

  await client.send(new DeleteObjectCommand({ Bucket, Key: key }));
  return true;
}

module.exports = { uploadObject, deleteObject, isEnabled, publicUrlForKey };

