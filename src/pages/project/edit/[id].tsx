import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import AdminLayout from "@/components/AdminLayout";
import EntityImageEditor from "@/components/EntityImageEditor";
import form from "@/styles/form.module.css";
import pe from "@/styles/postEditor.module.css";
import { useAdminAutosave } from "@/hooks/useAdminAutosave";
import { jsonSerialize, type ProjectFormPayload } from "@/hooks/entityFormTypes";

interface Project {
  id: number;
  title: string;
  content: string;
  type: string;
  thumbnailUrl?: string;
  galleryUrls?: string[];
}

function formatSavedTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" });
}

export default function EditProject() {
  const [project, setProject] = useState<Project | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("");
  const [savedSnapshot, setSavedSnapshot] = useState<ProjectFormPayload | null>(null);
  const [loadError, setLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [manualBusy, setManualBusy] = useState(false);
  const router = useRouter();
  const { id } = router.query;
  const parsed = typeof id === "string" ? Number.parseInt(id, 10) : undefined;
  const numericId = parsed != null && !Number.isNaN(parsed) ? parsed : undefined;

  const values = useMemo<ProjectFormPayload>(
    () => ({ title, content, type }),
    [title, content, type]
  );

  const onSaveSuccess = useCallback((payload: ProjectFormPayload) => {
    setSavedSnapshot(payload);
    setProject((p) => (p ? { ...p, ...payload } : p));
  }, []);

  const buildProjectBody = useCallback(
    (entityId: number, v: ProjectFormPayload) => ({
      id: entityId,
      title: v.title,
      content: v.content,
      type: v.type,
    }),
    []
  );

  const { dirty, status, errorMessage, lastSavedAt, saveNow, retry } = useAdminAutosave({
    entityId: numericId,
    values,
    savedSnapshot,
    enabled: !isLoading && !loadError && project != null && savedSnapshot != null,
    serialize: jsonSerialize,
    endpoint: "/api/project/edit",
    buildRequestBody: buildProjectBody,
    onSaveSuccess,
    debounceMs: 1400,
  });

  useEffect(() => {
    if (id && typeof id === "string") {
      void fetchProject(id);
    }
  }, [id]);

  const fetchProject = async (projectId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/project/get?id=${projectId}`);
      if (response.ok) {
        const data = (await response.json()) as Project;
        setProject(data);
        setTitle(data.title);
        setContent(data.content);
        setType(data.type);
        setSavedSnapshot({
          title: data.title,
          content: data.content,
          type: data.type,
        });
        setLoadError("");
      } else {
        setLoadError("Proiectul nu a putut fi încărcat.");
      }
    } catch (error) {
      console.error("Error fetching project:", error);
      setLoadError("A apărut o eroare la încărcarea proiectului.");
    } finally {
      setIsLoading(false);
    }
  };

  const refetchProject = () => {
    if (id && typeof id === "string") {
      void fetchProject(id);
    }
  };

  const onManualSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setManualBusy(true);
    try {
      await saveNow();
    } finally {
      setManualBusy(false);
    }
  };

  const statusLine = (() => {
    if (status === "saving") {
      return <span className={`${pe.toolbarStatus} ${pe.toolbarStatusSaving}`}>Se salvează…</span>;
    }
    if (status === "error") {
      return (
        <span className={`${pe.toolbarStatus} ${pe.toolbarStatusError}`}>
          {errorMessage}
          <button type="button" className={pe.retryBtn} onClick={() => retry()}>
            Reîncearcă
          </button>
        </span>
      );
    }
    if (status === "saved" && lastSavedAt != null) {
      return (
        <span className={`${pe.toolbarStatus} ${pe.toolbarStatusSaved}`}>
          Salvat la {formatSavedTime(lastSavedAt)}
        </span>
      );
    }
    if (dirty) {
      return (
        <span className={pe.toolbarStatus}>
          Modificări nesalvate — se salvează automat după ce încetezi să tastezi.
        </span>
      );
    }
    return <span className={pe.toolbarStatus}>Totul e salvat.</span>;
  })();

  if (isLoading) {
    return (
      <AdminLayout title="Proiect">
        <div className={form.loading}>Se încarcă…</div>
      </AdminLayout>
    );
  }

  if (loadError) {
    return (
      <AdminLayout title="Proiect">
        <div className={form.errorPage} role="alert">
          {loadError}
        </div>
      </AdminLayout>
    );
  }

  if (!project || numericId == null) {
    return (
      <AdminLayout title="Proiect">
        <div className={form.errorPage} role="alert">
          Proiect inexistent.
        </div>
      </AdminLayout>
    );
  }

  const saveDisabled = manualBusy || status === "saving" || (!dirty && status !== "error");

  return (
    <AdminLayout title="Editare proiect">
      <div className={pe.pageWrap}>
        <div className={pe.toolbar} role="region" aria-label="Salvare">
          {statusLine}
          <div className={pe.toolbarActions}>
            <Link href="/" className={pe.linkQuiet}>
              ← Listă
            </Link>
            <Link href="/project/create" className={pe.linkQuiet}>
              + Proiect nou
            </Link>
            <button
              type="submit"
              form="vad-project-form"
              className={pe.saveNowBtn}
              disabled={saveDisabled}
            >
              {manualBusy || status === "saving" ? "Se salvează…" : "Salvează acum"}
            </button>
          </div>
        </div>

        <h1 className={pe.heroTitle} style={{ marginBottom: "1rem" }}>
          Editare proiect
          <span
            style={{
              fontWeight: 500,
              fontSize: "0.85rem",
              color: "var(--vad-muted)",
              marginLeft: "0.5rem",
            }}
          >
            #{numericId}
          </span>
        </h1>

        <div className={pe.layoutGrid}>
          <form
            id="vad-project-form"
            className={pe.formCard}
            onSubmit={(e) => void onManualSave(e)}
          >
            <div className={form.form}>
              <div className={form.formGroup}>
                <label htmlFor="title">Titlu</label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Titlul proiectului"
                  autoComplete="off"
                />
                <span className={pe.fieldHint}>Poți completa treptat; salvarea e automată.</span>
              </div>
              <div className={form.formGroup}>
                <label htmlFor="content">Descriere / conținut</label>
                <textarea
                  id="content"
                  className={pe.contentTextarea}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Descrierea proiectului…"
                />
              </div>
              <div className={form.formGroup}>
                <label htmlFor="type">Tip (ex. social, educație, p)</label>
                <input
                  type="text"
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  placeholder="p"
                />
                <span className={pe.fieldHint}>
                  Folosit la filtrare pe site; lasă „p” dacă nu ai un cod dedicat.
                </span>
              </div>
            </div>
          </form>

          <aside className={pe.sideCard} aria-label="Imagini">
            <p className={pe.sideCardHint}>
              Coperta și galeria se încarcă aici. Textul din stânga are salvare automată.
            </p>
            <EntityImageEditor
              entity="project"
              id={numericId}
              thumbnailUrl={project.thumbnailUrl}
              galleryUrls={project.galleryUrls}
              onUpdate={refetchProject}
            />
          </aside>
        </div>
      </div>
    </AdminLayout>
  );
}
