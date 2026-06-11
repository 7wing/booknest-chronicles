import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import imageCompression from "browser-image-compression";

interface UploadOptions {
  bucket: string;
  folder?: string;
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
}

export function useUpload() {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const upload = useCallback(
    async (file: File, options: UploadOptions): Promise<string> => {
      setIsUploading(true);
      setProgress(0);

      try {
        const compressed = await imageCompression(file, {
          maxSizeMB: options.maxSizeMB ?? 1,
          maxWidthOrHeight: options.maxWidthOrHeight ?? 1200,
          useWebWorker: true,
          onProgress: (p) => setProgress(Math.round(p / 2)),
        });

        const ext = file.name.split(".").pop() ?? "jpg";
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const filePath = options.folder
          ? `${options.folder}/${fileName}`
          : fileName;

        const { error } = await supabase.storage
          .from(options.bucket)
          .upload(filePath, compressed, {
            cacheControl: "3600",
            upsert: false,
          });

        if (error) throw error;

        setProgress(100);

        const { data } = supabase.storage
          .from(options.bucket)
          .getPublicUrl(filePath);

        return data.publicUrl;
      } finally {
        setIsUploading(false);
      }
    },
    []
  );

  return { upload, progress, isUploading };
}
