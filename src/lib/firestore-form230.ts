import { FieldValue, getFirestore, type DocumentData, type Timestamp } from "firebase-admin/firestore";
import { getAdminApp } from "@/lib/firebase-admin";
import { maskCnp } from "@/lib/cnp";
import {
  FORM230_STATUSES,
  type Form230Duration,
  type Form230ListRow,
  type Form230Status,
} from "@/lib/form230-config";

function form230Collection(): string {
  return process.env.FIRESTORE_FORM230_COLLECTION?.trim() || "form230_submissions";
}

function db() {
  return getFirestore(getAdminApp());
}

function coerceDate(v: unknown): Date {
  if (v instanceof Date) return v;
  if (v && typeof v === "object" && "toDate" in v && typeof (v as Timestamp).toDate === "function") {
    return (v as Timestamp).toDate();
  }
  if (typeof v === "string" || typeof v === "number") return new Date(v);
  return new Date();
}

function asStatus(v: unknown): Form230Status {
  const s = String(v ?? "nou");
  return (FORM230_STATUSES as readonly string[]).includes(s) ? (s as Form230Status) : "nou";
}

export type Form230Record = {
  id: string;
  taxYear: number;
  campaignYear: number;
  nume: string;
  prenume: string;
  initiala: string;
  cnp: string;
  email: string;
  telefon: string;
  localitate: string;
  judet: string;
  strada: string;
  numar: string;
  durationYears: Form230Duration;
  consentGdpr: boolean;
  consentAnafShare: boolean;
  consentNewsletter: boolean;
  signaturePng: string;
  pdfBase64: string;
  driveFileId: string;
  status: Form230Status;
  errorNote: string;
  source: string;
  createdAt: Date;
};

const LIST_FIELDS = [
  "taxYear",
  "campaignYear",
  "nume",
  "prenume",
  "cnp",
  "localitate",
  "judet",
  "durationYears",
  "consentAnafShare",
  "status",
  "errorNote",
  "createdAt",
  "hasPdf",
] as const;

function docToRecord(id: string, data: DocumentData): Form230Record {
  const duration = data.durationYears === "1" ? "1" : "2";
  return {
    id,
    taxYear: Number(data.taxYear) || 0,
    campaignYear: Number(data.campaignYear) || 0,
    nume: String(data.nume ?? ""),
    prenume: String(data.prenume ?? ""),
    initiala: String(data.initiala ?? ""),
    cnp: String(data.cnp ?? ""),
    email: String(data.email ?? ""),
    telefon: String(data.telefon ?? ""),
    localitate: String(data.localitate ?? ""),
    judet: String(data.judet ?? ""),
    strada: String(data.strada ?? ""),
    numar: String(data.numar ?? ""),
    durationYears: duration,
    consentGdpr: data.consentGdpr === true,
    consentAnafShare: data.consentAnafShare === true,
    consentNewsletter: data.consentNewsletter === true,
    signaturePng: typeof data.signaturePng === "string" ? data.signaturePng : "",
    pdfBase64: typeof data.pdfBase64 === "string" ? data.pdfBase64 : "",
    driveFileId: String(data.driveFileId ?? ""),
    status: asStatus(data.status),
    errorNote: String(data.errorNote ?? ""),
    source: String(data.source ?? ""),
    createdAt: coerceDate(data.createdAt),
  };
}

export async function adminListForm230(opts: {
  taxYear: number;
  status?: Form230Status | "all";
}): Promise<Form230ListRow[]> {
  const snap = await db()
    .collection(form230Collection())
    .where("taxYear", "==", opts.taxYear)
    .select(...LIST_FIELDS)
    .get();
  let rows = snap.docs.map((d) => {
    const rec = docToRecord(d.id, d.data());
    const row: Form230ListRow = {
      id: rec.id,
      taxYear: rec.taxYear,
      createdAt: rec.createdAt.toISOString(),
      status: rec.status,
      nume: rec.nume,
      prenume: rec.prenume,
      cnpMasked: maskCnp(rec.cnp),
      localitate: rec.localitate,
      judet: rec.judet,
      durationYears: rec.durationYears,
      consentAnafShare: rec.consentAnafShare,
      hasPdf: d.data().hasPdf === true,
      errorNote: rec.errorNote,
    };
    return row;
  });
  if (opts.status && opts.status !== "all") {
    rows = rows.filter((r) => r.status === opts.status);
  }
  rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return rows;
}

export async function adminGetForm230(id: string): Promise<Form230Record | undefined> {
  const snap = await db().collection(form230Collection()).doc(id).get();
  if (!snap.exists) return undefined;
  return docToRecord(snap.id, snap.data()!);
}

export async function adminGetForm230Many(ids: string[]): Promise<Form230Record[]> {
  const unique = Array.from(new Set(ids.map((id) => id.trim()).filter(Boolean)));
  if (unique.length === 0) return [];
  const refs = unique.map((id) => db().collection(form230Collection()).doc(id));
  const snaps = await db().getAll(...refs);
  return snaps.filter((s) => s.exists).map((s) => docToRecord(s.id, s.data()!));
}

export async function adminUpdateForm230(
  id: string,
  patch: Partial<{
    status: Form230Status;
    errorNote: string;
    nume: string;
    prenume: string;
    initiala: string;
    cnp: string;
    email: string;
    telefon: string;
    localitate: string;
    judet: string;
    strada: string;
    numar: string;
    durationYears: Form230Duration;
    consentAnafShare: boolean;
  }>
): Promise<boolean> {
  const ref = db().collection(form230Collection()).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return false;
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) {
    if (v !== undefined) clean[k] = v;
  }
  if (Object.keys(clean).length === 0) return true;
  clean.updatedAt = FieldValue.serverTimestamp();
  await ref.update(clean);
  return true;
}

export async function adminSetForm230Status(ids: string[], status: Form230Status): Promise<number> {
  const unique = Array.from(new Set(ids.map((id) => id.trim()).filter(Boolean)));
  let n = 0;
  const batchSize = 400;
  for (let i = 0; i < unique.length; i += batchSize) {
    const batch = db().batch();
    const chunk = unique.slice(i, i + batchSize);
    for (const id of chunk) {
      batch.update(db().collection(form230Collection()).doc(id), {
        status,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    await batch.commit();
    n += chunk.length;
  }
  return n;
}
