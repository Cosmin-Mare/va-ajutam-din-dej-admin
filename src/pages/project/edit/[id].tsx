import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
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
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    console.log('useEffect triggered, id:', id);
    if (id && typeof id === 'string') {
      fetchProject(id);
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
      } else {
        setError('Failed to fetch project');
      }
    } catch (error) {
      console.error('Error fetching project:', error);
      setError('An error occurred while fetching the project');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        setError(data.message || 'Failed to update project');
      }
    } catch (error) {
      console.error('Error updating project:', error);
      setError('An error occurred while updating the project');
    }
  };

  if (isLoading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!project) {
    return <div className={styles.error}>Project not found</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Edit Project</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="content">Content</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="type">Type</label>
          <input
            type="text"
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            required
          />
        </div>
        <button type="submit" className={styles.submitButton}>
          Update Project
        </button>
      </form>
    </div>
  );
}
