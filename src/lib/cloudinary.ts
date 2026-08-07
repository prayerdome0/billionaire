/**
 * Cloudinary integration — certificate PDF hosting.
 *
 * Cloudinary account (from project owner):
 *   - Cloud name:    dhad95cch
 *   - Upload preset: seedwel  (Signing mode: UNSIGNED — safe for direct browser uploads)
 *   - Asset folder:  samples/ecommerce  (set inside the preset — applied automatically)
 *
 * The preset is unsigned, so certificates are uploaded straight from the student's
 * browser to Cloudinary with no API secret exposed. The resulting secure URL is
 * stored on the Firestore certificate claim (`certificates/{uid}`) and shown on
 * the student's certificate page, the admin portal, and the public verify page.
 *
 * To override in production, set:
 *   VITE_CLOUDINARY_CLOUD_NAME=dhad95cch
 *   VITE_CLOUDINARY_UPLOAD_PRESET=seedwel
 * (and server-side CLOUDINARY_URL=cloudinary://<key>:<secret>@dhad95cch if you
 * ever want signed uploads from the server).
 */

export const CLOUDINARY_CLOUD_NAME: string =
  (import.meta as any).env?.VITE_CLOUDINARY_CLOUD_NAME || "dhad95cch";

export const CLOUDINARY_UPLOAD_PRESET: string =
  (import.meta as any).env?.VITE_CLOUDINARY_UPLOAD_PRESET || "seedwel";

export const CLOUDINARY_ASSET_FOLDER = "samples/ecommerce"; // set in the preset's Asset folder setting

export interface CloudinaryUploadResult {
  secureUrl: string;
  publicId: string;
  resourceType: string;
  assetFolder: string;
}

/**
 * Uploads a certificate PDF (or any blob) to Cloudinary using the unsigned
 * "seedwel" preset. Throws if Cloudinary is unreachable or the preset rejects.
 */
export async function uploadCertificateFile(blob: Blob, fileName: string): Promise<CloudinaryUploadResult> {
  const url = `https://api.cloudinary.com/v1_1/${encodeURIComponent(CLOUDINARY_CLOUD_NAME)}/auto/upload`;

  const form = new FormData();
  form.append("file", blob, fileName);
  form.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const res = await fetch(url, { method: "POST", body: form });
  if (!res.ok) {
    let detail = "";
    try {
      const body = await res.json();
      detail = body?.error?.message || JSON.stringify(body);
    } catch {
      detail = await res.text().catch(() => "");
    }
    throw new Error(`Cloudinary upload failed (${res.status}): ${detail}`);
  }

  const data = await res.json();
  return {
    secureUrl: data.secure_url || data.url || "",
    publicId: data.public_id || "",
    resourceType: data.resource_type || "raw",
    assetFolder: CLOUDINARY_ASSET_FOLDER,
  };
}
