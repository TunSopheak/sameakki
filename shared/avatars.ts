// Sticker avatars people can pick. The database stores only the key.

export const BOY_AVATARS = ['m1', 'm2', 'm3', 'm4', 'm5'] as const;
export const GIRL_AVATARS = ['f1', 'f2', 'f3', 'f4', 'f5'] as const;
export const AVATAR_KEYS = [...BOY_AVATARS, ...GIRL_AVATARS] as const;

export type AvatarKey = (typeof AVATAR_KEYS)[number];

export const isAvatarKey = (value: unknown): value is AvatarKey => AVATAR_KEYS.includes(value as AvatarKey);
