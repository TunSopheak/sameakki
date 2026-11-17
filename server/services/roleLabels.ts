/** Role names for the Khmer activity feed */
export const ROLE_KM: Record<string, string> = {
  super_admin: 'អ្នកគ្រប់គ្រងជាន់ខ្ពស់',
  team_lead: 'ប្រធានក្រុម',
  member: 'សមាជិក',
  viewer: 'អ្នកមើល',
};

export const roleKm = (role: string) => ROLE_KM[role] ?? role;
