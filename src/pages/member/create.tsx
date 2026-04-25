import { useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/AdminLayout';
import styles from '@/styles/form.module.css';

export default function CreateMember() {
  const [name, setName] = useState('');
  const [status, setStatus] = useState('');
  const [isCouncil, setIsCouncil] = useState(false);
  const [link, setLink] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/member/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, status, is_council: isCouncil, link }),
      });

      if (response.ok) {
        router.push('/');
      } else {
        const data = await response.json();
        setError(data.message || 'Nu s-a putut crea înregistrarea.');
      }
    } catch {
      setError('A apărut o eroare la crearea membului.');
    }
  };

  return (
    <AdminLayout title="Membru nou">
      <div className={styles.container}>
        <h1 className={styles.title}>Membru nou</h1>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="name">Nume</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="status">Rol / statut</label>
            <input
              type="text"
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel} htmlFor="is_council">
              <input
                type="checkbox"
                id="is_council"
                checked={isCouncil}
                onChange={(e) => setIsCouncil(e.target.checked)}
              />
              Membru al consiliului
            </label>
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="link">Link Facebook (opțional)</label>
            <input
              type="url"
              id="link"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://www.facebook.com/…"
            />
          </div>
          <div className={styles.formActions}>
            <button type="submit" className={styles.submitButton}>
              Salvează
            </button>
          </div>
        </form>
        {error && <p className={styles.error}>{error}</p>}
      </div>
    </AdminLayout>
  );
}
