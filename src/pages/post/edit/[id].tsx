import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import AdminLayout from "@/components/AdminLayout";
import EntityImageEditor from "@/components/EntityImageEditor";
import form from "@/styles/form.module.css";
import pe from "@/styles/postEditor.module.css";
import { useAdminAutosave } from "@/hooks/useAdminAutosave";
import { jsonSerialize, type PostFormPayload } from "@/hooks/entityFormTypes";

interface Post {
  id: number;
  title: string;
  content: string;
  link: string;
  date: string;
  thumbnailUrl?: string;
  galleryUrls?: string[];
}

function formatSavedTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" });
}

export default function EditPost() {
  const [post, setPost] = useState<Post | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [link, setLink] = useState("");
  const [date, setDate] = useState("");
  const [savedSnapshot, setSavedSnapshot] = useState<PostFormPayload | null>(null);
  const [loadError, setLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [manualBusy, setManualBusy] = useState(false);
  const router = useRouter();
  const { id } = router.query;
  const postId = typeof id === "string" ? Number.parseInt(id, 10) : undefined;
  const numericId = postId != null && !Number.isNaN(postId) ? postId : undefined;

  const values = useMemo<PostFormPayload>(
    () => ({ title, content, link, date }),
    [title, content, link, date]
  );

  const onSaveSuccess = useCallback((payload: PostFormPayload) => {
    setSavedSnapshot(payload);
    setPost((p) => (p ? { ...p, ...payload } : p));
  }, []);

  const buildPostBody = useCallback((id: number, v: PostFormPayload) => ({ id, ...v }), []);

  const { dirty, status, errorMessage, lastSavedAt, saveNow, retry } = useAdminAutosave({
    entityId: numericId,
    values,
    savedSnapshot,
    enabled: !isLoading && !loadError && post != null && savedSnapshot != null,
    serialize: jsonSerialize,
    endpoint: "/api/post/edit",
    buildRequestBody: buildPostBody,
    onSaveSuccess,
    debounceMs: 1400,
  });

  useEffect(() => {
    if (id && typeof id === "string") {
      void fetchPost(id);
    }
  }, [id]);

  const fetchPost = async (postIdStr: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/post/get?id=${postIdStr}`);
      if (response.ok) {
        const data = (await response.json()) as Post;
        setPost(data);
        setTitle(data.title);
        setContent(data.content);
        setLink(data.link);
        const datePart = data.date.includes("T") ? data.date.split("T")[0] : data.date.slice(0, 10);
        setDate(datePart);
        setSavedSnapshot({
          title: data.title,
          content: data.content,
          link: data.link,
          date: datePart,
        });
        setLoadError("");
      } else {
        setLoadError("Postarea nu a putut fi încărcată.");
      }
    } catch (error) {
      console.error("Error fetching post:", error);
      setLoadError("A apărut o eroare la încărcarea postării.");
    } finally {
      setIsLoading(false);
    }
  };

  const refetchPost = () => {
    if (id && typeof id === "string") {
      void fetchPost(id);
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
      <AdminLayout title="Postare">
        <div className={form.loading}>Se încarcă…</div>
      </AdminLayout>
    );
  }

  if (loadError) {
    return (
      <AdminLayout title="Postare">
        <div className={form.errorPage} role="alert">
          {loadError}
        </div>
      </AdminLayout>
    );
  }

  if (!post || numericId == null) {
    return (
      <AdminLayout title="Postare">
        <div className={form.errorPage} role="alert">
          Postare inexistentă.
        </div>
      </AdminLayout>
    );
  }

  const saveDisabled = manualBusy || status === "saving" || (!dirty && status !== "error");

  return (
    <AdminLayout title="Editare postare">
      <div className={pe.pageWrap}>
        <div className={pe.toolbar} role="region" aria-label="Salvare">
          {statusLine}
          <div className={pe.toolbarActions}>
            <Link href="/" className={pe.linkQuiet}>
              ← Listă
            </Link>
            <Link href="/post/create" className={pe.linkQuiet}>
              + Postare nouă
            </Link>
            <button
              type="submit"
              form="vad-post-form"
              className={pe.saveNowBtn}
              disabled={saveDisabled}
            >
              {manualBusy || status === "saving" ? "Se salvează…" : "Salvează acum"}
            </button>
          </div>
        </div>

        <h1 className={pe.heroTitle} style={{ marginBottom: "1rem" }}>
          Editare postare
          <span style={{ fontWeight: 500, fontSize: "0.85rem", color: "var(--vad-muted)", marginLeft: "0.5rem" }}>
            #{numericId}
          </span>
        </h1>

        <div className={pe.layoutGrid}>
          <form
            id="vad-post-form"
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
                  placeholder="Titlul afișat pe site"
                  autoComplete="off"
                />
                <span className={pe.fieldHint}>Poți lăsa temporar gol; completează înainte de publicare.</span>
              </div>
              <div className={form.formGroup}>
                <label htmlFor="content">Conținut</label>
                <textarea
                  id="content"
                  className={pe.contentTextarea}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Textul noutății…"
                />
              </div>
              <div className={form.formGroup}>
                <label htmlFor="link">Link Facebook (opțional)</label>
                <input
                  type="url"
                  id="link"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://www.facebook.com/…"
                />
              </div>
              <div className={form.formGroup}>
                <label htmlFor="date">Data publicării</label>
                <input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                <span className={pe.fieldHint}>Folosită pentru ordinea noutăților pe site.</span>
              </div>
            </div>
          </form>

          <aside className={pe.sideCard} aria-label="Imagini">
            <p className={pe.sideCardHint}>
              Coperta și galeria se încarcă aici. După încărcare, modificările apar pe site; textul
              de mai sus are salvare automată.
            </p>
            <EntityImageEditor
              entity="post"
              id={numericId}
              thumbnailUrl={post.thumbnailUrl}
              galleryUrls={post.galleryUrls}
              onUpdate={refetchPost}
            />
          </aside>
        </div>
      </div>
    </AdminLayout>
  );
}
