/**
 * Setlist and booking contract (R6).
 * The agreed setlist comes from the artist's repertoire; any other song is a request the artist
 * accepts (optionally for an extra fee) or declines. Price, setlist, accepted requests and terms are
 * frozen into a numbered contract version that both sides accept; any change makes a new version.
 */

export type SongRequestStatus = "pending" | "accepted" | "declined";

export interface SongRequest {
  id: string;
  title: string;
  originalArtist: string;
  status: SongRequestStatus;
  /** Extra fee the artist asked for, minor units (0 = free). */
  extraFee: number;
  note: string;
}

export interface ContractTerms {
  price: number;
  depositPct: number;
  cancelPolicy: number;
  /** Repertoire song ids, in order. */
  setlist: string[];
  /** Accepted song requests (title · original artist). */
  extraSongs: { title: string; originalArtist: string; extraFee: number }[];
  /** Who holds the public performance licence (VCPMC in VN, SOCAN / Re:Sound in Canada). */
  licenceHolder: "venue" | "artist" | "client";
  notes: string;
}

export interface ContractVersion {
  version: number;
  createdAt: string;
  terms: ContractTerms;
  buyerAcceptedAt: string | null;
  artistAcceptedAt: string | null;
}

export type ContractState = "none" | "awaiting_both" | "awaiting_buyer" | "awaiting_artist" | "signed";

export function contractState(c: ContractVersion | null | undefined): ContractState {
  if (!c) return "none";
  if (c.buyerAcceptedAt && c.artistAcceptedAt) return "signed";
  if (c.buyerAcceptedAt) return "awaiting_artist";
  if (c.artistAcceptedAt) return "awaiting_buyer";
  return "awaiting_both";
}

/** Setlist songs must come from the repertoire; returns the unknown ids (empty when valid). */
export function invalidSetlistSongs(setlist: string[], repertoireIds: string[]): string[] {
  const known = new Set(repertoireIds);
  return setlist.filter((id) => !known.has(id));
}

export function totalWithExtras(terms: Pick<ContractTerms, "price" | "extraSongs">): number {
  return terms.price + terms.extraSongs.reduce((s, x) => s + x.extraFee, 0);
}

export function acceptedExtras(requests: SongRequest[]): ContractTerms["extraSongs"] {
  return requests.filter((r) => r.status === "accepted").map(({ title, originalArtist, extraFee }) => ({ title, originalArtist, extraFee }));
}

const sameTerms = (a: ContractTerms, b: ContractTerms) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Next contract version for new terms. Unchanged terms keep the current version (and its acceptances);
 * changed terms start a new version that nobody has accepted yet.
 */
export function reviseContract(current: ContractVersion | null, terms: ContractTerms, now: string): ContractVersion {
  if (current && sameTerms(current.terms, terms)) return current;
  return { version: (current?.version ?? 0) + 1, createdAt: now, terms, buyerAcceptedAt: null, artistAcceptedAt: null };
}

export function acceptContract(c: ContractVersion, side: "buyer" | "artist", now: string): ContractVersion {
  return side === "buyer" ? { ...c, buyerAcceptedAt: c.buyerAcceptedAt ?? now } : { ...c, artistAcceptedAt: c.artistAcceptedAt ?? now };
}
