import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import AdminLayout from "@/components/AdminLayout";
import pe from "@/styles/postEditor.module.css";
import form from "@/styles/form.module.css";

export default function CreatePost() {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const startDraft = async () => {
    setCreating(true);
    setError("");
    try {
      const response = await fetch("/api/post/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (response.ok) {
        const data = (await response.json()) as { id?: number };
        if (data.id) {
          void router.push(`/post/edit/${data.id}`);
          return;
        }
      }
      const data = (await response.json().catch(() => ({}))) as { message?: string };
      setError(data.message || "Nu s-a putut crea postarea.");
    } catch {
      setError("Eroare de rețea. Încearcă din nou.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <AdminLayout title="Postare nouă">
      <div className={pe.pageWrap}>
        <div className={pe.heroCard}>
          <h1 className={pe.heroTitle}>Postare nouă</h1>
          <p className={pe.heroLead}>
            Creează o postare goală și vei fi dus direct în editor. Textul și data se salvează
            automat după ce încetezi să tastezi — nu mai trebuie să apeși „Salvează” la fiecare
            modificare.
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
              ← Înapoi la listă fără a crea postare
            </Link>
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
