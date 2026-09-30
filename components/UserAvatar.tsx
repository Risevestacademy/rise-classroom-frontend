import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";

export function UserAvatar() {
  return (
    <Avatar className="relative h-9 w-9">
      <AvatarImage src="/default-avatar.png" alt="User avatar" />
      <AvatarFallback className="relative h-full w-full overflow-hidden">
        <Image
          src="/default-avatar.png"
          alt="Default Avatar"
          fill
          sizes="36px"
          className="object-cover"
        />
      </AvatarFallback>
    </Avatar>
  );
}