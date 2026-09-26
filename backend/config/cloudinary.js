// Cloudinary settings, read from env at call time (so it works no matter when
// dotenv is loaded). The API secret is only ever used here, on the server, to
// sign upload requests — the browser uploads straight to Cloudinary with that
// signature and never sees the secret.

function getCloudinaryEnv() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return null;
  return { cloudName, apiKey, apiSecret };
}

/** True only for delivery URLs that belong to *our* Cloudinary cloud. */
function isCloudinaryUrl(url) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName || typeof url !== "string") return false;
  return url.startsWith(`https://res.cloudinary.com/${cloudName}/`);
}

/** Mongoose validator: optional field, but if set it must be one of our URLs. */
const cloudinaryUrlValidator = {
  validator: (v) => !v || isCloudinaryUrl(v),
  message: "url must be a Cloudinary URL from this project's cloud",
};

module.exports = { getCloudinaryEnv, isCloudinaryUrl, cloudinaryUrlValidator };
