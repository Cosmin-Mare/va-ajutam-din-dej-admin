'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
      router.push('/');
    } else {
      const data = await response.json();
      setError(data.message || 'Autentificare eșuată');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <h3 className={styles.title}>Autentificare Administrator</h3>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="username">Nume de utilizator</label>
            <input
              type="text"
              id="username"
              placeholder="Introduceți numele de utilizator"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="password">Parolă</label>
            <input
              type="password"
              id="password"
              placeholder="Introduceți parola"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className={styles.buttonContainer}>
            <button type="submit" className={styles.button}>Conectare</button>
          </div>
        </form>
        {error && <p className={styles.error}>{error}</p>}
      </div>
    </div>
  );
}
