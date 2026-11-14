// What the landing page shows under "Plans" and "Help this project grow".
// The Super Admin edits it in the Admin tab; these defaults are used until something is saved.

export const PRICE_TERMS = ['semester', 'month', 'year'] as const;
export type PriceTerm = (typeof PRICE_TERMS)[number];

export interface Sponsor {
  name: string;
  url?: string;
}

export interface LandingSettings {
  /** Shown big, for example "$4" or "16,000៛". Empty shows "Ask for the price". */
  studentPrice: string;
  studentTerm: PriceTerm;
  /** A short line under the price, in each language. */
  studentNoteKm: string;
  studentNoteEn: string;
  /** Most people in each student group. Match the "max members" you give a leader's account. */
  maxMembers: number;
  /** Shows the "first groups get a free month" line. Turn on only if you really offer it. */
  pilotOffer: boolean;
  /** Listed on the page. Never add anyone without their permission. */
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
