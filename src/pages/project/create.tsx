import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import AdminLayout from "@/components/AdminLayout";
import pe from "@/styles/postEditor.module.css";
import form from "@/styles/form.module.css";

export default function CreateProject() {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const startDraft = async () => {
    setCreating(true);
    setError("");
    try {
      const response = await fetch("/api/project/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (response.ok) {
        const data = (await response.json()) as { id?: number };
        if (data.id) {
          void router.push(`/project/edit/${data.id}`);
          return;
        }
      }
      const data = (await response.json().catch(() => ({}))) as { message?: string };
      setError(data.message || "Nu s-a putut crea proiectul.");
    } catch {
      setError("Eroare de rețea. Încearcă din nou.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <AdminLayout title="Proiect nou">
      <div className={pe.pageWrap}>
        <div className={pe.heroCard}>
          <h1 className={pe.heroTitle}>Proiect nou</h1>
          <p className={pe.heroLead}>
            Se creează un proiect gol și ești dus în editor. Titlul, descrierea și tipul se salvează
            automat după ce încetezi să tastezi; coperta și galeria sunt în panoul din dreapta.
          </p>
          <button
            type="button"
            className={pe.primaryCta}
            onClick={() => void startDraft()}
            disabled={creating}
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
              ← Înapoi la listă fără a crea proiect
            </Link>
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
