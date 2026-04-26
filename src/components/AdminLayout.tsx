import styles from './AdminLayout.module.css';
import AdminNav from './AdminNav';

type AdminLayoutProps = {
  children: React.ReactNode;
  title?: string;
};

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  return (
    <div className={styles.layout}>
      <header className={styles.topBar}>
        <div className={styles.topBarInner}>
          <div className={styles.topRow}>
            <div className={styles.topBarLeft}>
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
          <AdminNav />
        </div>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
