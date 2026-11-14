// Default plan and sponsors for the landing page (the Super Admin edits them in Admin)

export const PRICE_TERMS = ['semester', 'month', 'year'] as const;
export type PriceTerm = (typeof PRICE_TERMS)[number];

export interface Sponsor {
  name: string;
  url?: string;
}

export interface LandingSettings {
  studentPrice: string;
  studentTerm: PriceTerm;
  studentNoteKm: string;
  studentNoteEn: string;
  maxMembers: number;
  pilotOffer: boolean;
  sponsors: Sponsor[];
}

export const LANDING_LIMITS = {
  price: 24,
  note: 160,
  sponsors: 20,
  sponsorName: 80,
  url: 300,
  maxMembers: 1000,
} as const;

export const DEFAULT_LANDING_SETTINGS: LandingSettings = {
  studentPrice: '$4',
  studentTerm: 'semester',
  studentNoteKm: 'ប្រហែល 16,000៛ · ក្រុម ៥ នាក់ ចែកគ្នា តិចជាង $1 ក្នុងម្នាក់',
  studentNoteEn: 'About 16,000៛ · split by a group of 5, under $1 each',
  maxMembers: 10,
  pilotOffer: false,
  sponsors: [],
};
