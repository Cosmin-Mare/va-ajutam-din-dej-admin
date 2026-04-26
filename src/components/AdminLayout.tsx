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
          </div>
          <AdminNav />
        </div>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
