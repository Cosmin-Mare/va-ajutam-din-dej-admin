import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import AdminLayout from "@/components/AdminLayout";
import {
  FORM230_STATUS_LABEL,
  FORM230_STATUSES,
  type Form230Duration,
  type Form230Status,
} from "@/lib/form230-config";
import styles from "./form230.module.css";

type Detail = {
  id: string;
  taxYear: number;
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
  consentNewsletter: boolean;
  signaturePng: string;
  status: Form230Status;
  errorNote: string;
  createdAt: string;
  hasPdf: boolean;
};

export default function Form230DetailPage() {
  const router = useRouter();
  const id = typeof router.query.id === "string" ? router.query.id : "";
  const [row, setRow] = useState<Detail | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/form230/get?id=${encodeURIComponent(id)}`);
      const data = (await res.json()) as Detail & { message?: string };
      if (cancelled) return;
      if (!res.ok) {
        setError(data.message || "Nu am găsit formularul.");
        return;
      }
      setRow(data);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const save = async () => {
    if (!row) return;
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/form230/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: row.id,
          status: row.status,
          errorNote: row.errorNote,
          nume: row.nume,
          prenume: row.prenume,
          initiala: row.initiala,
          cnp: row.cnp,
          email: row.email,
          telefon: row.telefon,
          localitate: row.localitate,
          judet: row.judet,
          strada: row.strada,
          numar: row.numar,
          durationYears: row.durationYears,
          consentAnafShare: row.consentAnafShare,
        }),
      });
      if (!res.ok) {
        const j = (await res.json()) as { message?: string };
        throw new Error(j.message || "Salvarea a eșuat");
      }
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Eroare");
    } finally {
      setBusy(false);
    }
  };

  const set = (patch: Partial<Detail>) => setRow((r) => (r ? { ...r, ...patch } : r));

  return (
    <AdminLayout title={row ? `${row.nume} ${row.prenume}` : "Formular 230"}>
      <div className={styles.wrap}>
        <p>
          <Link href="/form230">← Toate formularele</Link>
        </p>
        {error ? <p className={styles.error}>{error}</p> : null}
        {!row ? (
          <p>Se încarcă…</p>
        ) : (
          <>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label htmlFor="nume">Nume</label>
                <input id="nume" value={row.nume} onChange={(e) => set({ nume: e.target.value })} />
              </div>
              <div className={styles.field}>
                <label htmlFor="prenume">Prenume</label>
                <input
                  id="prenume"
                  value={row.prenume}
                  onChange={(e) => set({ prenume: e.target.value })}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="initiala">Inițială</label>
                <input
                  id="initiala"
                  value={row.initiala}
                  onChange={(e) => set({ initiala: e.target.value })}
                  maxLength={2}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="cnp">CNP</label>
                <input
                  id="cnp"
                  className={styles.mono}
                  value={row.cnp}
                  onChange={(e) => set({ cnp: e.target.value })}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="email">Email</label>
                <input id="email" value={row.email} onChange={(e) => set({ email: e.target.value })} />
              </div>
              <div className={styles.field}>
                <label htmlFor="telefon">Telefon</label>
                <input
                  id="telefon"
                  value={row.telefon}
                  onChange={(e) => set({ telefon: e.target.value })}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="localitate">Localitate</label>
                <input
                  id="localitate"
                  value={row.localitate}
                  onChange={(e) => set({ localitate: e.target.value })}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="judet">Județ</label>
                <input id="judet" value={row.judet} onChange={(e) => set({ judet: e.target.value })} />
              </div>
              <div className={styles.field}>
                <label htmlFor="strada">Strada</label>
                <input
                  id="strada"
                  value={row.strada}
                  onChange={(e) => set({ strada: e.target.value })}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="numar">Număr</label>
                <input id="numar" value={row.numar} onChange={(e) => set({ numar: e.target.value })} />
              </div>
              <div className={styles.field}>
                <label htmlFor="duration">Durată</label>
                <select
                  id="duration"
                  value={row.durationYears}
                  onChange={(e) => set({ durationYears: e.target.value as Form230Duration })}
                >
                  <option value="1">1 an</option>
                  <option value="2">2 ani</option>
                </select>
              </div>
              <div className={styles.field}>
                <label htmlFor="st">Status</label>
                <select
                  id="st"
                  value={row.status}
                  onChange={(e) => set({ status: e.target.value as Form230Status })}
                >
                  {FORM230_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {FORM230_STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
              </div>
              <div className={`${styles.field} ${styles.full}`}>
                <label htmlFor="err">Notă eroare</label>
                <input
                  id="err"
                  value={row.errorNote}
                  onChange={(e) => set({ errorNote: e.target.value })}
                />
              </div>
            </div>
            <label className={styles.warn}>
              <input
                type="checkbox"
                checked={row.consentAnafShare}
                onChange={(e) => set({ consentAnafShare: e.target.checked })}
              />{" "}
              Acord comunicare date ANAF → asociație
            </label>
            <p className={styles.warn}>
              Newsletter: {row.consentNewsletter ? "da" : "nu"} · An fiscal {row.taxYear} ·{" "}
              {new Date(row.createdAt).toLocaleString("ro-RO")}
            </p>
            {row.signaturePng ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className={styles.sig} src={row.signaturePng} alt="Semnătură" />
            ) : (
              <p className={styles.error}>Lipsește semnătura.</p>
            )}
            <div className={styles.actions}>
              <button type="button" className={styles.primaryButton} disabled={busy} onClick={() => void save()}>
                {busy ? "Se salvează…" : "Salvează"}
              </button>
              {row.hasPdf ? (
                <a className={styles.ghostButton} href={`/api/form230/pdf?id=${encodeURIComponent(row.id)}`}>
                  Descarcă PDF
                </a>
              ) : null}
            </div>
            {saved ? <p className={styles.warn}>Salvat.</p> : null}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
