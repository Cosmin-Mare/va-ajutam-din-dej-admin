import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import styles from "./AdminNav.module.css";

export const HOME_FIXED_HEADER_ID = "admin-app-header";

type Variant = "home" | "layout";

type NavId = "panou" | "posts" | "projects" | "members" | "sponsors" | "partners";

type NavItem = {
  id: NavId;
  label: string;
  sectionId?: "posts" | "projects" | "members" | "sponsors" | "partners";
};

const ITEMS: NavItem[] = [
  { id: "panou", label: "Panou" },
  { id: "posts", label: "Noutăți", sectionId: "posts" },
  { id: "projects", label: "Proiecte", sectionId: "projects" },
  { id: "members", label: "Membri", sectionId: "members" },
  { id: "sponsors", label: "Sponsori", sectionId: "sponsors" },
  { id: "partners", label: "Parteneri", sectionId: "partners" },
];

const SECTION_IDS = ["posts", "projects", "members", "sponsors", "partners"] as const;

function routeActiveId(pathname: string): NavId | null {
  if (pathname.startsWith("/post")) return "posts";
  if (pathname.startsWith("/project")) return "projects";
  if (pathname.startsWith("/member")) return "members";
  if (pathname.startsWith("/sponsor-partner")) return null;
  if (pathname === "/") return "panou";
  return "panou";
}

/** Which section is active: compare section top to the line just below the fixed top bar (viewport). */
function getActiveFromScroll(headerHeightPx: number): NavId {
  if (typeof document === "undefined") return "panou";
  const yLine = headerHeightPx + 4;
  const first = document.getElementById("posts");
  if (first) {
    const t = first.getBoundingClientRect().top;
    if (t > yLine) return "panou";
  }
  let current: NavId = "panou";
  for (const id of SECTION_IDS) {
    const el = document.getElementById(id);
    if (!el) continue;
    if (el.getBoundingClientRect().top <= yLine) current = id;
  }
  return current;
}

type Props = {
  variant?: Variant;
};

export default function AdminNav({ variant = "layout" }: Props) {
  const router = useRouter();
  const pathname = router.pathname;
  const [homeScrollId, setHomeScrollId] = useState<NavId>("panou");
  const rafRef = useRef<number | null>(null);

  const routeId = routeActiveId(pathname);
  const isHomeDashboard = variant === "home" && pathname === "/";
  const active: NavId | null = isHomeDashboard ? homeScrollId : routeId;
  const onDashboard = pathname === "/";

  const recompute = useCallback(() => {
    if (!isHomeDashboard) return;
    const header = document.getElementById(HOME_FIXED_HEADER_ID);
    const h = header?.getBoundingClientRect().height ?? 64;
    setHomeScrollId(getActiveFromScroll(h));
  }, [isHomeDashboard]);

  const schedule = useCallback(() => {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      recompute();
    });
  }, [recompute]);

  useLayoutEffect(() => {
    if (!isHomeDashboard || !router.isReady) return;
    recompute();
  }, [isHomeDashboard, router.isReady, recompute]);

  useEffect(() => {
    if (!isHomeDashboard) return;
    recompute();
    const onScroll = () => schedule();
    const onResize = () => schedule();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    const t = window.setTimeout(recompute, 400);
    let ro: ResizeObserver | undefined;
    const header = document.getElementById(HOME_FIXED_HEADER_ID);
    if (header && typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => schedule());
      ro.observe(header);
    }
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.clearTimeout(t);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      ro?.disconnect();
    };
  }, [isHomeDashboard, recompute, schedule]);

  const isActive = (id: NavId) => active != null && active === id;

  const sectionHref = (id: string) => (onDashboard ? `#${id}` : `/#${id}`);

  const wrapperClass = [
    styles.wrapper,
    variant === "home" && styles.homeBar,
    variant === "layout" && styles.inLayout,
  ]
    .filter(Boolean)
    .join(" ");

  const list = (
    <ul className={styles.list}>
      {ITEMS.map((item) => {
        if (item.id === "panou") {
          const on = isActive("panou");
          return (
            <li key={item.id} className={styles.item}>
              {onDashboard ? (
                <a
                  href="#main-content"
                  className={`${styles.link} ${on ? styles.active : ""}`}
                  aria-current={on ? "true" : undefined}
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  href="/"
                  className={`${styles.link} ${on ? styles.active : ""}`}
                  aria-current={on ? "page" : undefined}
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        }

        const on = isActive(item.id);
        const href = item.sectionId ? sectionHref(item.sectionId) : "/";

        return (
          <li key={item.id} className={styles.item}>
            <a
              href={href}
              className={`${styles.link} ${on ? styles.active : ""}`}
              aria-current={on ? "true" : undefined}
            >
              {item.label}
            </a>
          </li>
        );
      })}
    </ul>
  );

  return (
    <nav className={wrapperClass} aria-label="Zonă administrare">
      {variant === "home" ? <div className={styles.listScroll}>{list}</div> : list}
    </nav>
  );
}
