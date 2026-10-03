import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";

export function UserAvatar({ user, isLoading = false }: { user: { name: string; avatar: string }, isLoading?: boolean }) {
  return (
    <Avatar className="relative h-9 w-9">
      {isLoading ? (
        <Skeleton className="h-9 w-9 rounded-full" />
      ) : (
        <>
          <AvatarImage src={user.avatar} alt={user.name} />
          <AvatarFallback className="relative h-full w-full overflow-hidden">
            <Image
              src="/default-avatar.png"
              alt="Default Avatar"
              fill
              sizes="36px"
              className="object-cover"
            />
          </AvatarFallback>
        </>
      )}
    </Avatar>
  );
}