import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cloudinaryImage } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";

/**
 * A person's avatar: their uploaded photo (face-cropped by Cloudinary) with
 * initials as the fallback while loading or when they haven't uploaded one.
 * `className` sets the size (e.g. "size-8"); `textClassName` the initials size.
 */
export function UserAvatar({
  src,
  initials,
  className,
  textClassName = "text-sm",
}: {
  src?: string;
  initials: string;
  className?: string;
  textClassName?: string;
}) {
  return (
    <Avatar className={className}>
      {src && (
        <AvatarImage
          src={cloudinaryImage(src, "c_fill,g_face,w_160,h_160")}
          alt=""
        />
      )}
      <AvatarFallback
        className={cn("bg-primary/10 font-medium text-primary", textClassName)}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
