const asyncHandler = require("express-async-handler");
const { v2: cloudinary } = require("cloudinary");
const { getCloudinaryEnv } = require("../config/cloudinary");

const IMAGE_FORMATS = "jpg,jpeg,png,webp";

// What each kind of upload is allowed to be. The folder (and, where set, the
// allowed formats) are part of the signed payload, so the client can't change
// them without invalidating the signature.
const PURPOSES = {
  avatar: {
    folder: "sambhav/avatars",
    resourceType: "image",
    allowedFormats: IMAGE_FORMATS,
  },
  proof: {
    folder: "sambhav/proofs",
    resourceType: "image",
    allowedFormats: `${IMAGE_FORMATS},pdf`,
  },
  data: { folder: "sambhav/data", resourceType: "auto" },
  workspace: { folder: "sambhav/workspace", resourceType: "auto" },
};

// POST /api/uploads/sign  { purpose }
// Returns everything the browser needs to POST a file directly to Cloudinary.
const signUpload = asyncHandler(async (req, res) => {
  const env = getCloudinaryEnv();
  if (!env) {
    res.status(503);
    throw new Error(
      "File uploads aren't configured on the server (missing CLOUDINARY_* env vars)"
    );
  }

  const purpose = PURPOSES[req.body?.purpose];
  if (!purpose) {
    res.status(400);
    throw new Error(`purpose must be one of: ${Object.keys(PURPOSES).join(", ")}`);
  }

  const params = {
    folder: purpose.folder,
    timestamp: Math.round(Date.now() / 1000),
  };
  if (purpose.allowedFormats) params.allowed_formats = purpose.allowedFormats;

  const signature = cloudinary.utils.api_sign_request(params, env.apiSecret);

  res.json({
    uploadUrl: `https://api.cloudinary.com/v1_1/${env.cloudName}/${purpose.resourceType}/upload`,
    apiKey: env.apiKey,
    signature,
    // Form fields to send alongside `file`, exactly as signed.
    params,
  });
});

module.exports = { signUpload };
