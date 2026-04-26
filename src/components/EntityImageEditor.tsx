import { useState } from "react";
/* next/image e înecesar pentru domenii Firebase Storage; previzualizări admin. */
/* eslint-disable @next/next/no-img-element */
import m from "./EntityImageEditor.module.css";

type Entity = "post" | "project" | "member" | "sponsor_partner";

function readFileAsDataUrl(f: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("read error"));
    r.readAsDataURL(f);
  });
}

type BaseProps = {
  entity: Entity;
  id: number;
  onUpdate: () => void | Promise<void>;
};

type PostProjectProps = BaseProps & {
  entity: "post" | "project";
  thumbnailUrl?: string;
  galleryUrls?: string[];
};

type MemberProps = BaseProps & {
  entity: "member";
  photoUrl?: string;
  thumbnailUrl?: never;
  galleryUrls?: never;
};

type SponsorPartnerProps = BaseProps & {
  entity: "sponsor_partner";
  logoUrl?: string;
  thumbnailUrl?: never;
  galleryUrls?: never;
  photoUrl?: never;
};

type Props = PostProjectProps | MemberProps | SponsorPartnerProps;

function isPostProject(p: Props): p is PostProjectProps {
  return p.entity === "post" || p.entity === "project";
}

export default function EntityImageEditor(props: Props) {
  const { entity, id, onUpdate } = props;
  const [busy, setBusy] = useState<"thumb" | "gall" | "del" | "delOne" | null>(null);
  const [err, setErr] = useState("");

  const doUpload = async (
    field: "thumbnail" | "gallery" | "photo" | "logo",
    dataBase64: string,
    fileName: string
  ) => {
    setErr("");
    setBusy(field === "thumbnail" || field === "photo" || field === "logo" ? "thumb" : "gall");
    try {
      const r = await fetch("/api/admin/upload-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity, id, field, dataBase64, fileName }),
      });
      if (!r.ok) {
        const d = (await r.json().catch(() => ({}))) as { message?: string };
        setErr(d.message || "Încărcare eșuată");
        return;
      }
      await onUpdate();
    } catch {
      setErr("A apărut o eroare de rețea");
    } finally {
      setBusy(null);
    }
  };

  const onPickThumb = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f || !f.type.startsWith("image/")) return;
    const data = await readFileAsDataUrl(f);
    if (entity === "member") {
      await doUpload("photo", data, f.name);
    } else if (entity === "sponsor_partner") {
      await doUpload("logo", data, f.name);
    } else {
      await doUpload("thumbnail", data, f.name);
    }
  };

  const onPickGallery = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f || !f.type.startsWith("image/")) return;
    const data = await readFileAsDataUrl(f);
    await doUpload("gallery", data, f.name);
  };

  const deleteThumbOrPhoto = async () => {
    if (entity === "member") {
      if (!props.photoUrl) return;
    } else if (entity === "sponsor_partner") {
      if (!(props as SponsorPartnerProps).logoUrl) return;
    } else if (!isPostProject(props) || !props.thumbnailUrl) {
      return;
    }
    setErr("");
    setBusy("del");
    try {
      const body: Record<string, string | number> = { entity, id };
      if (entity === "member") {
        body.field = "photo";
      } else if (entity === "sponsor_partner") {
        body.field = "logo";
      } else {
        body.field = "thumbnail";
      }
      const r = await fetch("/api/admin/delete-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        setErr("Ștergere eșuată");
        return;
      }
      await onUpdate();
    } catch {
      setErr("Eroare la ștergere");
    } finally {
      setBusy(null);
    }
  };

  const deleteOneGallery = async (url: string) => {
    if (!isPostProject(props)) return;
    setErr("");
    setBusy("delOne");
    try {
      const r = await fetch("/api/admin/delete-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity, id, field: "gallery", url }),
      });
      if (!r.ok) {
        setErr("Ștergere din galerie eșuată");
        return;
      }
      await onUpdate();
    } catch {
      setErr("Eroare la ștergere");
    } finally {
      setBusy(null);
    }
  };

  if (entity === "sponsor_partner") {
    const p = props as SponsorPartnerProps;
    return (
      <div className={m.block}>
        <h2 className={m.heading}>Logo</h2>
        <p className={m.hint}>
          Logo afișat în grila de sponsori sau parteneri. Format recomandat: WebP sau PNG. Maxim ~8MB.
        </p>
        <div className={m.thumbBox}>
          {p.logoUrl ? (
            <img className={m.preview} src={p.logoUrl} alt="" />
          ) : (
            <div className={m.previewPlaceholder} aria-hidden>
              fără logo
            </div>
          )}
          <div className={m.actions}>
            <label className={m.primary}>
              <input
                className={m.srOnly}
                type="file"
                accept="image/*"
                onChange={onPickThumb}
                disabled={!!busy}
              />
              {busy === "thumb" ? "Se încarcă…" : p.logoUrl ? "Înlocuiește" : "Adaugă logo"}
            </label>
            {p.logoUrl ? (
              <button
                type="button"
                className={m.danger}
                disabled={!!busy}
                onClick={deleteThumbOrPhoto}
              >
                {busy === "del" ? "…" : "Șterge logo-ul"}
              </button>
            ) : null}
          </div>
        </div>
        {err ? (
          <p className={m.error} role="alert">
            {err}
          </p>
        ) : null}
      </div>
    );
  }

  if (entity === "member") {
    const p = props as MemberProps;
    return (
      <div className={m.block}>
        <h2 className={m.heading}>Fotografie</h2>
        <p className={m.hint}>
          Poza de pe site. Format recomandat: WebP sau JPEG. Maxim ~8MB.
        </p>
        <div className={m.thumbBox}>
          {p.photoUrl ? (
            <img className={m.preview} src={p.photoUrl} alt="" />
          ) : (
            <div className={m.previewPlaceholder} aria-hidden>
              fără fotografie
            </div>
          )}
          <div className={m.actions}>
            <label className={m.primary}>
              <input
                className={m.srOnly}
                type="file"
                accept="image/*"
                onChange={onPickThumb}
                disabled={!!busy}
              />
              {busy === "thumb" ? "Se încarcă…" : p.photoUrl ? "Înlocuiește" : "Adaugă fotografie"}
            </label>
            {p.photoUrl ? (
              <button
                type="button"
                className={m.danger}
                disabled={!!busy}
                onClick={deleteThumbOrPhoto}
              >
                {busy === "del" ? "…" : "Șterge fotografia"}
              </button>
            ) : null}
          </div>
        </div>
        {err ? (
          <p className={m.error} role="alert">
            {err}
          </p>
        ) : null}
      </div>
    );
  }

  if (!isPostProject(props)) return null;
  const thumb = props.thumbnailUrl;
  const gallery = props.galleryUrls ?? [];

  const listHint =
    entity === "post" ? "Apare pe listele de noutăți." : "Apare pe listele de proiecte.";

  return (
    <div className={m.block}>
      <h2 className={m.heading}>Imagine copertă (thumbnail)</h2>
      <p className={m.hint}>
        {listHint} Pătrat echilibrat, format recomandat: WebP sau JPEG.
      </p>
      <div className={m.thumbBox}>
        {thumb ? (
          <img className={m.preview} src={thumb} alt="" />
        ) : (
          <div className={m.previewPlaceholder} aria-hidden>
            fără copertă
          </div>
        )}
        <div className={m.actions}>
          <label className={m.primary}>
            <input
              className={m.srOnly}
              type="file"
              accept="image/*"
              onChange={onPickThumb}
              disabled={!!busy}
            />
            {busy === "thumb" ? "Se încarcă…" : thumb ? "Înlocuiește" : "Adaugă copertă"}
          </label>
          {thumb ? (
            <button type="button" className={m.danger} disabled={!!busy} onClick={deleteThumbOrPhoto}>
              {busy === "del" ? "…" : "Șterge coperta"}
            </button>
          ) : null}
        </div>
      </div>

      <h2 className={m.heading} style={{ marginTop: "1.1rem" }}>
        Galerie
      </h2>
      <p className={m.hint}>Fotografii suplimentare pe pagina detaliu.</p>
      <div className={m.actions} style={{ marginBottom: 8 }}>
        <label className={m.secondary}>
          <input
            className={m.srOnly}
            type="file"
            accept="image/*"
            onChange={onPickGallery}
            disabled={!!busy}
          />
          {busy === "gall" ? "Se încarcă…" : "Adaugă la galerie"}
        </label>
      </div>
      {gallery.length > 0 ? (
        <ul className={m.gallery}>
          {gallery.map((url) => (
            <li key={url} className={m.row}>
              <img className={m.galleryImg} src={url} alt="" />
              <button
                type="button"
                className={m.danger}
                disabled={!!busy}
                onClick={() => void deleteOneGallery(url)}
              >
                Șterge
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className={m.hint}>Galeria este goală.</p>
      )}

      {err ? (
        <p className={m.error} role="alert">
          {err}
        </p>
      ) : null}
    </div>
  );
}
