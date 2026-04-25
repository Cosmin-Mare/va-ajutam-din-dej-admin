import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/AdminLayout';
import styles from '@/styles/form.module.css';

interface Project {
  id: number;
  title: string;
  content: string;
  type: string;
}

export default function EditProject() {
  const [project, setProject] = useState<Project | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('');
  const [loadError, setLoadError] = useState('');
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if (id && typeof id === 'string') {
      void fetchProject(id);
    }
  }, [id]);

  const fetchProject = async (projectId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/project/get?id=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setProject(data);
        setTitle(data.title);
        setContent(data.content);
        setType(data.type);
        setLoadError('');
      } else {
        setLoadError('Proiectul nu a putut fi încărcat.');
      }
    } catch (error) {
      console.error('Error fetching project:', error);
      setLoadError('A apărut o eroare la încărcarea proiectului.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      const response = await fetch('/api/project/edit', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, title, content, type }),
      });

      if (response.ok) {
        router.push('/');
      } else {
        const data = await response.json();
        setFormError(data.message || 'Actualizarea a eșuat.');
      }
    } catch (error) {
      console.error('Error updating project:', error);
      setFormError('A apărut o eroare la salvare.');
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="Proiect">
        <div className={styles.loading}>Se încarcă…</div>
      </AdminLayout>
    );
  }

  if (loadError) {
    return (
      <AdminLayout title="Proiect">
        <div className={styles.errorPage} role="alert">
          {loadError}
        </div>
      </AdminLayout>
    );
  }

  if (!project) {
    return (
      <AdminLayout title="Proiect">
        <div className={styles.errorPage} role="alert">
          Proiect inexistent.
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Editare proiect">
      <div className={styles.container}>
        <h1 className={styles.title}>Editare proiect</h1>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="title">Titlu</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="content">Descriere / conținut</label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="type">Tip</label>
            <input
              type="text"
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              required
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
