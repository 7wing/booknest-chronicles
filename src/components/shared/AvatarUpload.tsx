import { useDropzone } from "react-dropzone";
import { Camera } from "lucide-react";
import { useUpload } from "@/hooks/useUpload";
import { useAuthStore } from "@/store/authStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function AvatarUpload() {
  const { profile, updateProfile } = useAuthStore();
  const { upload, isUploading, progress } = useUpload();

  const { getRootProps, getInputProps } = useDropzone({
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp"] },
    maxFiles: 1,
    onDrop: async (files) => {
      const url = await upload(files[0], {
        bucket: "avatars",
        folder: profile?.id,
        maxSizeMB: 0.5,
        maxWidthOrHeight: 400,
      });
      await updateProfile({ avatar_url: url });
    },
  });

  return (
    <div {...getRootProps()} className="relative cursor-pointer group">
      <input {...getInputProps()} />
      <Avatar className="h-24 w-24 border-4 border-accent/30">
        <AvatarImage src={profile?.avatar_url ?? undefined} />
        <AvatarFallback className="text-2xl font-heading font-bold bg-accent/10 text-accent">
          {profile?.display_name?.[0] ?? profile?.username?.[0] ?? "?"}
        </AvatarFallback>
      </Avatar>
      <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        {isUploading ? (
          <span className="text-white text-xs font-medium">{progress}%</span>
        ) : (
          <Camera className="h-6 w-6 text-white" />
        )}
      </div>
    </div>
  );
}