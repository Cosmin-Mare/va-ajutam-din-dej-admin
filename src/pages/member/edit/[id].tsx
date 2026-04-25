import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/AdminLayout';
import styles from '@/styles/form.module.css';

interface Member {
  id: number;
  name: string;
  status: string;
  link: string;
  is_council: boolean;
}

export default function EditMember() {
  const [member, setMember] = useState<Member | null>(null);
  const [name, setName] = useState('');
  const [status, setStatus] = useState('');
  const [link, setLink] = useState('');
  const [isCouncil, setIsCouncil] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if (id && typeof id === 'string') {
      void fetchMember(id);
    }
  }, [id]);

  const fetchMember = async (memberId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/member/get?id=${memberId}`);
      if (response.ok) {
        const data = await response.json();
        setMember(data);
        setName(data.name);
        setStatus(data.status);
        setIsCouncil(data.is_council);
        setLink(data.link);
        setLoadError('');
      } else {
        setLoadError('Membrul nu a putut fi încărcat.');
      }
    } catch (error) {
      console.error('Error fetching member:', error);
      setLoadError('A apărut o eroare la încărcare.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      const response = await fetch('/api/member/edit', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name, status, is_council: isCouncil, link }),
      });

      if (response.ok) {
        router.push('/');
      } else {
        const data = await response.json();
        setFormError(data.message || 'Actualizarea a eșuat.');
      }
    } catch (error) {
      console.error('Error updating member:', error);
      setFormError('A apărut o eroare la salvare.');
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="Membru">
        <div className={styles.loading}>Se încarcă…</div>
      </AdminLayout>
    );
  }

  if (loadError) {
    return (
      <AdminLayout title="Membru">
        <div className={styles.errorPage} role="alert">
          {loadError}
        </div>
      </AdminLayout>
    );
  }

  if (!member) {
    return (
      <AdminLayout title="Membru">
        <div className={styles.errorPage} role="alert">
          Membru inexistent.
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Editare membru">
      <div className={styles.container}>
        <h1 className={styles.title}>Editare membru</h1>
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
              Salvează modificările
            </button>
          </div>
        </form>
        {formError && <p className={styles.error}>{formError}</p>}
      </div>
    </AdminLayout>
  );
}
