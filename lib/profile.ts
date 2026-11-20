import { queryOptions } from "@tanstack/react-query";

import { api, type Envelope } from "@/lib/api";
import type { Role, UserStatus } from "@/lib/auth";

export const profileBasePath = "/admin/profile";

export const profileRoutes = {
  academy: `${profileBasePath}/academy`,
  personal: `${profileBasePath}/personal`,
  password: `${profileBasePath}/personal/password`,
} as const;

const avatarPeople = [
  "james-brown",
  "sophia-williams",
  "arthur-taylor",
  "emma-wright",
  "matthew-johnson",
  "laura-perez",
  "wei-chen",
  "lena-muller",
  "juma-omondi",
  "natalia-nowak",
  "ravi-patel",
  "nuray-aksoy",
];

/* The design system's illustrated and cartoon avatars, in public/avatars. */
export const presetAvatars = ["illustration", "cartoon"].flatMap((style) =>
  avatarPeople.map((person) => `/avatars/${style}-${person}.png`),
);

/** Turns a preset avatar into a file `PATCH /me` can take as the new photo. */
export async function presetAvatarFile(src: string) {
  const blob = await fetch(src).then((response) => response.blob());
  return new File([blob], src.split("/").pop()!, { type: "image/png" });
}

/** Shape of `GET /me`. */
export type MyProfile = {
  id: string;
  firstName: string;
  lastName: string;
  displayName?: string | null;
  phoneNumber?: string | null;
  location?: string | null;
  description?: string | null;
  email: string;
  image?: string | null;
  role: Role;
  status: UserStatus;
  onboardedAt?: string | null;
  createdAt: string;
  organization?: { id: string; name: string } | null;
};

/** What `PATCH /me` accepts. First name, last name and email are not editable here. */
export type UpdateMyProfileInput = {
  displayName?: string;
  phoneNumber?: string;
  image?: File | null;
};

async function getMyProfile() {
  const { data } = await api.get<Envelope<MyProfile>>("/me");
  return data;
}

/** Sent as multipart so a new photo can go in the same request. */
export async function updateMyProfile({ image, ...fields }: UpdateMyProfileInput) {
  const body = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) body.append(key, value);
  }
  if (image) body.append("image", image);

  const { data } = await api.patch<Envelope<MyProfile>>("/me", body);
  return data;
}

export const profileQueries = {
  me: () =>
    queryOptions({
      queryKey: ["me"] as const,
      queryFn: getMyProfile,
    }),
};
