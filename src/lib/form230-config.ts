export function form230TaxYear(now = new Date()): number {
  const raw = (process.env.FORM230_TAX_YEAR || process.env.NEXT_PUBLIC_FORM230_TAX_YEAR || "").trim();
  if (/^\d{4}$/.test(raw)) return Number(raw);
  return now.getFullYear() - 1;
}

export const FORM230_ORG = {
  nameXml: "Asociația Va Ajutam din Dej",
  nameDisplay: "Asociația Vă Ajutăm din Dej",
  cui: "42960042",
  ibanRon: (process.env.FORM230_IBAN || "RO37BTRLRONCRT0565463401").replace(/\s/g, ""),
  email: "contact@vaajutamdindej.ro",
  phone: "0723290245",
} as const;

export const FORM230_STATUSES = [
  "nou",
  "verificat",
  "cu_eroare",
  "inclus_in_borderou",
  "depus_anaf",
] as const;

export type Form230Status = (typeof FORM230_STATUSES)[number];

export const FORM230_STATUS_LABEL: Record<Form230Status, string> = {
  nou: "Nou",
  verificat: "Verificat",
  cu_eroare: "Cu eroare",
  inclus_in_borderou: "Inclus în borderou",
  depus_anaf: "Depus ANAF",
};

export type Form230Duration = "1" | "2";

export type Form230ListRow = {
  id: string;
  taxYear: number;
  createdAt: string;
  status: Form230Status;
  nume: string;
  prenume: string;
  cnpMasked: string;
  localitate: string;
  judet: string;
  durationYears: Form230Duration;
  consentAnafShare: boolean;
  hasPdf: boolean;
  errorNote: string;
};
