import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/AdminLayout';
import styles from '@/styles/form.module.css';

interface Post {
  id: number;
  title: string;
  content: string;
  link: string;
  date: string;
}

export default function EditPost() {
  const [post, setPost] = useState<Post | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [link, setLink] = useState('');
  const [date, setDate] = useState('');
  const [loadError, setLoadError] = useState('');
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if (id && typeof id === 'string') {
      void fetchPost(id);
    }
  }, [id]);

  const fetchPost = async (postId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/post/get?id=${postId}`);
      if (response.ok) {
        const data = await response.json();
        setPost(data);
        setTitle(data.title);
        setContent(data.content);
        setLink(data.link);
        setDate(data.date.split('T')[0]);
        setLoadError('');
      } else {
        setLoadError('Postarea nu a putut fi încărcată.');
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      setLoadError('A apărut o eroare la încărcarea postării.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      const response = await fetch('/api/post/edit', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, title, content, link, date }),
      });

      if (response.ok) {
        router.push('/');
      } else {
        const data = await response.json();
        setFormError(data.message || 'Actualizarea a eșuat.');
      }
    } catch (error) {
      console.error('Error updating post:', error);
      setFormError('A apărut o eroare la salvare.');
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="Postare">
        <div className={styles.loading}>Se încarcă…</div>
      </AdminLayout>
    );
  }

  if (loadError) {
    return (
      <AdminLayout title="Postare">
        <div className={styles.errorPage} role="alert">
          {loadError}
        </div>
      </AdminLayout>
    );
  }

  if (!post) {
    return (
      <AdminLayout title="Postare">
        <div className={styles.errorPage} role="alert">
          Postare inexistentă.
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Editare postare">
      <div className={styles.container}>
        <h1 className={styles.title}>Editare postare</h1>
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
            <label htmlFor="content">Conținut</label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
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
          <div className={styles.formGroup}>
            <label htmlFor="date">Data</label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
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
