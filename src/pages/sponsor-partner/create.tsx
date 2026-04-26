import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import AdminLayout from "@/components/AdminLayout";
import pe from "@/styles/postEditor.module.css";
import form from "@/styles/form.module.css";

function roleFromQuery(q: string | string[] | undefined): "sponsor" | "partner" | undefined {
  const v = Array.isArray(q) ? q[0] : q;
  if (v === "partner" || v === "sponsor") return v;
  return undefined;
}

export default function CreateSponsorPartner() {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const presetRole = roleFromQuery(router.query.role);

  const startDraft = async () => {
    setCreating(true);
    setError("");
    const role = roleFromQuery(router.query.role) ?? "sponsor";
    try {
      const response = await fetch("/api/sponsor-partner/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (response.ok) {
        const data = (await response.json()) as { id?: number };
        if (data.id) {
          void router.push(`/sponsor-partner/edit/${data.id}`);
          return;
        }
      }
      const data = (await response.json().catch(() => ({}))) as { message?: string };
      setError(data.message || "Nu s-a putut crea înregistrarea.");
    } catch {
      setError("Eroare de rețea. Încearcă din nou.");
    } finally {
      setCreating(false);
    }
  };

  const kindLabel = presetRole === "partner" ? "partener" : "sponsor";
  const titleShort = presetRole === "partner" ? "Partener nou" : "Sponsor nou";

  return (
    <AdminLayout title={titleShort}>
      <div className={pe.pageWrap}>
        <div className={pe.heroCard}>
          <h1 className={pe.heroTitle}>{titleShort}</h1>
          <p className={pe.heroLead}>
            Se creează o înregistrare ca <strong>{kindLabel}</strong> (poți schimba tipul în editor).
            Numele, site-ul și ordinea se salvează automat; logo-ul îl încarci în panoul din dreapta.
          </p>
          <button
            type="button"
            className={pe.primaryCta}
            onClick={() => void startDraft()}
            disabled={creating || !router.isReady}
          >
            {creating ? "Se creează editorul…" : "Deschide editorul"}
          </button>
          {error ? (
            <p className={form.error} role="alert" style={{ marginTop: "1rem" }}>
              {error}
            </p>
          ) : null}
          <p className={pe.secondaryNote}>
            <Link href="/" className={pe.linkQuiet}>
              ← Înapoi la listă fără a adăuga înregistrare
            </Link>
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
