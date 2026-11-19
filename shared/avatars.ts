// Sticker avatars people can pick. The database stores only the key.
//
// m1-m5 and f1-f5 are the first set. The rest are Khmer people through the ages, from the
// Funan kingdom (Nokor Phnom) to today: ten men (m6-m15) and ten women (f6-f15).

export const BOY_AVATARS = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9', 'm10', 'm11', 'm12', 'm13', 'm14', 'm15'] as const;
export const GIRL_AVATARS = ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10', 'f11', 'f12', 'f13', 'f14', 'f15'] as const;
export const AVATAR_KEYS = [...BOY_AVATARS, ...GIRL_AVATARS] as const;

export type AvatarKey = (typeof AVATAR_KEYS)[number];

export const isAvatarKey = (value: unknown): value is AvatarKey => AVATAR_KEYS.includes(value as AvatarKey);

/** The Khmer avatars, with who they are (shown when hovering in the picker) */
export const AVATAR_ERAS: Partial<Record<AvatarKey, { km: string; en: string }>> = {
  m6: { km: 'បុរសនគរភ្នំ', en: 'Funan man (1st-6th century)' },
  m7: { km: 'បុរសចេនឡា', en: 'Chenla man (6th-8th century)' },
  m8: { km: 'ព្រះរាជាអង្គរ', en: 'Angkor king' },
  m9: { km: 'អ្នកចម្បាំងបាយ័ន', en: 'Bayon warrior' },
  m10: { km: 'កសិករអង្គរ', en: 'Angkor farmer' },
  m11: { km: 'មន្ត្រីរាជវាំងឧត្តុង្គ', en: 'Oudong court official' },
  m12: { km: 'សម័យអាណាព្យាបាល (១៩០០)', en: 'Protectorate era (1900s)' },
  m13: { km: 'សម័យសង្គមរាស្ត្រនិយម (១៩៦០)', en: 'Sangkum era (1960s)' },
  m14: { km: 'និស្សិតសម័យថ្មី', en: 'Student today' },
  m15: { km: 'អ្នកធ្វើការសម័យថ្មី', en: 'Professional today' },
  f6: { km: 'ព្រះនាងសោមា នគរភ្នំ', en: 'Queen Soma of Funan' },
  f7: { km: 'នារីចេនឡា', en: 'Chenla lady' },
  f8: { km: 'ព្រះមហាក្សត្រីអង្គរ', en: 'Angkor queen' },
  f9: { km: 'អប្សរា', en: 'Apsara' },
  f10: { km: 'នារីជនបទអង្គរ', en: 'Angkor villager' },
  f11: { km: 'របាំរាជវាំងឧត្តុង្គ', en: 'Oudong royal dancer' },
  f12: { km: 'សម័យអាណាព្យាបាល (១៩០០)', en: 'Protectorate era (1900s)' },
  f13: { km: 'សម័យសង្គមរាស្ត្រនិយម (១៩៦០)', en: 'Sangkum era (1960s)' },
  f14: { km: 'និស្សិតសម័យថ្មី', en: 'Student today' },
  f15: { km: 'កញ្ញាសម័យថ្មី', en: 'Bride or professional today' },
};
