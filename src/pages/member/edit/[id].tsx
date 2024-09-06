import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '../../../styles/Form.module.css';

interface Member {
  id: number;
  name: string;
  status: string;
  is_council: boolean;
}

export default function EditMember() {
  const [member, setMember] = useState<Member | null>(null);
  const [name, setName] = useState('');
  const [status, setStatus] = useState('');
  const [isCouncil, setIsCouncil] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if (id && typeof id === 'string') {
      fetchMember(id);
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
      } else {
        setError('Failed to fetch member');
      }
    } catch (error) {
      console.error('Error fetching member:', error);
      setError('An error occurred while fetching the member');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/member/edit', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name, status, is_council: isCouncil }),
      });

      if (response.ok) {
        router.push('/');
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to update member');
      }
    } catch (error) {
      console.error('Error updating member:', error);
      setError('An error occurred while updating the member');
    }
  };

  if (isLoading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!member) {
    return <div className={styles.error}>Member not found</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Edit Member</h1>
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
        <button type="submit" className={styles.submitButton}>
          Update Member
        </button>
      </form>
    </div>
  );
}
