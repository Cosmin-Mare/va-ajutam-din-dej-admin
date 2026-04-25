import Link from 'next/link';
import styles from './AdminLayout.module.css';

type AdminLayoutProps = {
  children: React.ReactNode;
  title?: string;
};

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  return (
    <div className={styles.layout}>
      <header className={styles.topBar}>
        <div className={styles.topBarInner}>
          <div className={styles.topBarLeft}>
            <Link href="/" className={styles.backLink}>
              ← Înapoi la listă
            </Link>
            {title ? <span className={styles.breadcrumbTitle}>{title}</span> : null}
          </div>
          <a
            className={styles.publicSite}
            href="https://vaajutamdindej.ro"
            target="_blank"
            rel="noopener noreferrer"
          >
            Site public
            <span aria-hidden className={styles.externalIcon} />
          </a>
        </div>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
