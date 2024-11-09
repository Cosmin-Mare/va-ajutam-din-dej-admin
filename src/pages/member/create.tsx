import { useState } from 'react';
import { useRouter } from 'next/router';
import styles from '@/styles/form.module.css';

export default function CreateMember() {
  const [name, setName] = useState('');
  const [status, setStatus] = useState('');
  const [isCouncil, setIsCouncil] = useState(false);
  const [link, setLink] = useState('')
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
        setError(data.message || 'Error creating member');
      }
    } catch (error) {
      setError('Error creating member');
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Create New Member</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="status">Status</label>
          <input
            type="text"
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="is_council">Is Council Member</label>
          <input
            type="checkbox"
            id="is_council"
            checked={isCouncil}
            onChange={(e) => setIsCouncil(e.target.checked)}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="link">Link</label>
          <input
            type="text"
            id="link"
            value={status}
            onChange={(e) => setLink(e.target.value)}
            required
          />
        </div>
        <button type="submit" className={styles.submitButton}>Create Member</button>
      </form>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
