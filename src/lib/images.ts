import imageCompression from "browser-image-compression";

// Compress a phone photo of paper notes before upload.
// ~300 KB / 1600px keeps handwriting readable while fitting
// thousands of photos in Supabase's 1 GB free tier.
export async function compressPhoto(file: File): Promise<File> {
  return imageCompression(file, {
    maxSizeMB: 0.3,
    maxWidthOrHeight: 1600,
    fileType: "image/jpeg",
    initialQuality: 0.8,
    useWebWorker: true,
  });
}
