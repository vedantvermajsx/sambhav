// Cloudinary uploads (browser side).
//
// Files go straight from the browser to Cloudinary. The backend only signs the
// request (POST /uploads/sign) so the API secret never leaves the server.

import { apiPost } from "@/lib/api";
import type { Attachment } from "@/lib/types";

export type UploadPurpose = "avatar" | "proof" | "data" | "workspace";

/** An uploaded file's attachment record, with its Cloudinary URL. */
export type UploadedFile = Attachment & { url: string };

interface SignResponse {
  uploadUrl: string;
  apiKey: string;
  signature: string;
  /** Extra form fields that were part of the signature (folder, timestamp, ...). */
  params: Record<string, string | number>;
}

const MB = 1024 * 1024;

// Fast client-side checks. For images the server also pins the allowed formats
// inside the signature, so these are convenience, not the security boundary.
const RULES: Record<UploadPurpose, { maxBytes: number; accept: string }> = {
  avatar: { maxBytes: 5 * MB, accept: "image/jpeg,image/png,image/webp" },
  proof: {
    maxBytes: 10 * MB,
    accept: "image/jpeg,image/png,image/webp,application/pdf",
  },
  data: { maxBytes: 10 * MB, accept: ".csv,.xlsx,.xls,.json,.txt,.pdf" },
  workspace: {
    maxBytes: 10 * MB,
    accept: ".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg,.webp",
  },
};

/** Value for an <input type="file" accept="..."> for this kind of upload. */
export const uploadAccept = (purpose: UploadPurpose) => RULES[purpose].accept;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < MB) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / MB).toFixed(1)} MB`;
}

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot > -1 ? name.slice(dot + 1).toLowerCase() : "file";
}

/** Uploads one file and resolves to the attachment record to store. */
export async function uploadFile(
  file: File,
  purpose: UploadPurpose
): Promise<UploadedFile> {
  const { maxBytes } = RULES[purpose];
  if (file.size > maxBytes) {
    throw new Error(`"${file.name}" is larger than ${maxBytes / MB} MB.`);
  }

  const sign = await apiPost<SignResponse>("/uploads/sign", { purpose });

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sign.apiKey);
  form.append("signature", sign.signature);
  for (const [key, value] of Object.entries(sign.params)) {
    form.append(key, String(value));
  }

  let res: Response;
  try {
    res = await fetch(sign.uploadUrl, { method: "POST", body: form });
  } catch {
    throw new Error("Couldn't reach the upload service. Check your connection.");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.secure_url) {
    throw new Error(data?.error?.message ?? "Upload failed. Please try again.");
  }

  return {
    name: file.name,
    type: extensionOf(file.name),
    size: formatBytes(file.size),
    url: data.secure_url,
  };
}

/**
 * Adds Cloudinary delivery transforms (auto format + auto quality, plus an
 * optional resize such as "c_fill,w_320,h_240") to an image URL. Anything that
 * isn't a Cloudinary image URL is returned untouched.
 */
export function cloudinaryImage(url: string, resize?: string): string {
  const marker = "/image/upload/";
  if (!url.includes("res.cloudinary.com") || !url.includes(marker)) return url;
  const transform = ["f_auto", "q_auto", resize].filter(Boolean).join(",");
  return url.replace(marker, `${marker}${transform}/`);
}

const IMAGE_TYPES = new Set(["jpg", "jpeg", "png", "webp", "gif"]);

/** True for uploaded attachments that can be shown as a picture. */
export function isImageAttachment(a: { type: string; url?: string }): boolean {
  return !!a.url && IMAGE_TYPES.has(a.type.toLowerCase());
}
