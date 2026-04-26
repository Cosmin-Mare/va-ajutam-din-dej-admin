export type Post = {
  id: number;
  title: string;
  content: string;
  date: Date;
  link: string;
  thumbnailUrl?: string;
  galleryUrls?: string[];
};

export type Member = {
  id: number;
  name: string;
  status: string;
  is_council: boolean;
  link: string | null;
  photoUrl?: string;
};

export type Project = {
  id: number;
  title: string;
  content: string;
  type: "a" | "r" | (string & {});
  thumbnailUrl?: string;
  galleryUrls?: string[];
};

/** Aligned with public site `SponsorPartner` / `sponsor_partners` in Firestore. */
export type SponsorPartner = {
  id: number;
  name: string;
  /** Firebase Storage download URL (`logoStorageUrl` in Firestore). */
  logoUrl?: string;
  websiteUrl: string | null;
  role: "sponsor" | "partner";
  sortKey: number;
};
