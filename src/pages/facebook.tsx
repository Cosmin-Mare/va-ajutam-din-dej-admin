import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminLayout from "@/components/AdminLayout";
import styles from "./facebook.module.css";

type FacebookRow = {
  id: string;
  title: string;
  excerpt: string;
  createdTime: string;
  permalink: string;
  picture: string | null;
  alreadySynced: boolean;
  sitePostId: number | null;
};

export default function FacebookImportPage() {
  const [posts, setPosts] = useState<FacebookRow[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [successIds, setSuccessIds] = useState<number[]>([]);
  const [successSkipped, setSuccessSkipped] = useState(0);

  const loadPage = useCallback(async (after?: string) => {
    const params = new URLSearchParams({ limit: "15" });
    if (after) params.set("after", after);
    const res = await fetch(`/api/facebook/posts?${params.toString()}`);
    const data = (await res.json()) as {
      posts?: FacebookRow[];
      nextCursor?: string | null;
      message?: string;
    };
    if (!res.ok) throw new Error(data.message || "Nu am putut încărca postările Facebook.");
    return {
      posts: data.posts ?? [],
      nextCursor: data.nextCursor ?? null,
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const page = await loadPage();
        if (cancelled) return;
        setPosts(page.posts);
        setNextCursor(page.nextCursor);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Eroare la încărcare.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [loadPage]);

  const availableIds = useMemo(
    () => posts.filter((p) => !p.alreadySynced).map((p) => p.id),
    [posts]
  );
  const selectedIds = useMemo(
    () => availableIds.filter((id) => selected[id]),
    [availableIds, selected]
  );

  const toggle = (id: string, synced: boolean) => {
    if (synced) return;
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const selectUnsynced = () => {
    const next: Record<string, boolean> = {};
    for (const id of availableIds) next[id] = true;
    setSelected(next);
  };

  const loadMore = async () => {
    if (!nextCursor) return;
    setLoadingMore(true);
    setError("");
    try {
      const page = await loadPage(nextCursor);
      setPosts((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        return [...prev, ...page.posts.filter((p) => !seen.has(p.id))];
      });
      setNextCursor(page.nextCursor);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Eroare la încărcare.");
    } finally {
      setLoadingMore(false);
    }
  };

  const importSelected = async () => {
    if (selectedIds.length === 0) return;
    setImporting(true);
    setError("");
    setSuccessIds([]);
    setSuccessSkipped(0);
    try {
      const res = await fetch("/api/facebook/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const data = (await res.json()) as {
        message?: string;
        created?: number;
        skipped?: number;
        createdIds?: number[];
        errors?: string[];
      };
      if (!res.ok) throw new Error(data.message || "Importul a eșuat.");
      setSuccessIds(data.createdIds ?? []);
      setSuccessSkipped(data.skipped ?? 0);
      if (data.errors && data.errors.length > 0) {
        setError(data.errors.join(" "));
      }
      setSelected({});
      const page = await loadPage();
      setPosts(page.posts);
      setNextCursor(page.nextCursor);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Importul a eșuat.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <AdminLayout title="Import Facebook">
      <div className={styles.wrap}>
        <p className={styles.intro}>
          Postări recente de pe pagina Facebook <strong>VoluntariDejeni</strong>. Bifează ce vrei pe
          site — nimic nu se importă automat. După import poți edita titlul, textul și imaginile ca
          la orice noutate.
        </p>

        <div className={styles.toolbar}>
          <span className={styles.status}>
            {loading ? "Se încarcă postările…" : `${posts.length} postări încărcate`}
          </span>
          <div className={styles.toolbarActions}>
            <button type="button" className={styles.ghostButton} onClick={selectUnsynced} disabled={availableIds.length === 0}>
              Selectează neimportate
            </button>
            <Link href="/" className={styles.ghostButton}>
              Înapoi la panou
            </Link>
          </div>
        </div>

        {error ? <div className={styles.error}>{error}</div> : null}
        {successIds.length > 0 || successSkipped > 0 ? (
          <div className={styles.success}>
            {successIds.length > 0 ? (
              <>
                Importate {successIds.length} postări. Editează:{" "}
                {successIds.map((id, i) => (
                  <span key={id}>
                    {i > 0 ? ", " : null}
                    <Link href={`/post/edit/${id}`}>#{id}</Link>
                  </span>
                ))}
                {successSkipped > 0 ? ". " : "."}
              </>
            ) : null}
            {successSkipped > 0 ? `Sărite (deja pe site): ${successSkipped}.` : null}
          </div>
        ) : null}

        {loading ? (
          <p className={styles.status}>Se citesc postările de pe Facebook…</p>
        ) : posts.length === 0 ? (
          <p className={styles.status}>Nu am găsit postări pe pagină.</p>
        ) : (
          <div className={styles.list}>
            {posts.map((post) => (
              <article
                key={post.id}
                className={`${styles.card} ${post.alreadySynced ? styles.cardSynced : ""}`}
              >
                <div className={styles.checkWrap}>
                  <input
                    type="checkbox"
                    checked={Boolean(selected[post.id])}
                    disabled={post.alreadySynced}
                    onChange={() => toggle(post.id, post.alreadySynced)}
                    aria-label={`Selectează ${post.title}`}
                  />
                </div>
                {post.picture ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className={styles.thumb} src={post.picture} alt="" />
                ) : (
                  <div className={styles.thumbPlaceholder} aria-hidden />
                )}
                <div className={styles.body}>
                  <h2>{post.title}</h2>
                  <p className={styles.excerpt}>{post.excerpt}</p>
                  <div className={styles.meta}>
                    <span>
                      {new Date(post.createdTime).toLocaleString("ro-RO", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                    <a href={post.permalink} target="_blank" rel="noopener noreferrer">
                      Deschide pe Facebook
                    </a>
                    {post.alreadySynced ? (
                      post.sitePostId ? (
                        <Link href={`/post/edit/${post.sitePostId}`} className={styles.badge}>
                          Deja pe site
                        </Link>
                      ) : (
                        <span className={styles.badge}>Deja pe site</span>
                      )
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {nextCursor ? (
          <button
            type="button"
            className={styles.ghostButton}
            onClick={() => void loadMore()}
            disabled={loadingMore}
          >
            {loadingMore ? "Se încarcă…" : "Încarcă mai multe"}
          </button>
        ) : null}

        <div className={styles.footerBar}>
          <span className={styles.status}>
            {selectedIds.length === 0
              ? "Nicio postare selectată"
              : `${selectedIds.length} postări selectate`}
          </span>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => void importSelected()}
            disabled={importing || selectedIds.length === 0}
          >
            {importing ? "Se importă…" : "Importă pe site"}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
