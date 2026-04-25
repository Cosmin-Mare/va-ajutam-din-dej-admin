import { useState, useEffect } from 'react';
import styles from './index.module.css';
import Link from 'next/link';

interface Post {
  id: number;
  title: string;
  content: string;
  date: string;
  link: string;
}

interface Project {
  id: number;
  title: string;
  content: string;
  type: string;
}

interface Member {
  id: number;
  name: string;
  status: string;
  is_council: boolean;
  link: string;
}

interface ConfirmationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  message: string;
}

const ConfirmationPopup: React.FC<ConfirmationPopupProps> = ({
  isOpen,
  onClose,
  onConfirm,
  message,
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.popupOverlay} role="dialog" aria-modal="true" aria-labelledby="delete-confirm-title">
      <div className={styles.popup}>
        <p id="delete-confirm-title">{message}</p>
        <div className={styles.popupActions}>
          <button type="button" className={styles.popupCancel} onClick={onClose}>
            Anulează
          </button>
          <button type="button" className={styles.popupConfirm} onClick={onConfirm}>
            Șterge
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [popupState, setPopupState] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    message: '',
    onConfirm: () => {},
  });

  useEffect(() => {
    fetchPosts();
    fetchProjects();
    fetchMembers();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/post/get-all');
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/project/get-all');
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/member/get-all');
      if (response.ok) {
        const data = await response.json();
        setMembers(data);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const showDeleteConfirmation = (
    type: string,
    id: number,
    deleteFunction: (id: number) => Promise<void>
  ) => {
    setPopupState({
      isOpen: true,
      message: `Sigur doriți să ștergeți acest element (${type})? Acțiunea nu poate fi anulată.`,
      onConfirm: () => {
        void deleteFunction(id);
        setPopupState((s) => ({ ...s, isOpen: false }));
      },
    });
  };

  const closePopup = () => {
    setPopupState((s) => ({ ...s, isOpen: false }));
  };

  const deletePost = async (id: number) => {
    try {
      const response = await fetch(`/api/post/delete?id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        setPosts((prev) => prev.filter((post) => post.id !== id));
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const deleteProject = async (id: number) => {
    try {
      const response = await fetch(`/api/project/delete?id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        setProjects((prev) => prev.filter((project) => project.id !== id));
      }
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const deleteMember = async (id: number) => {
    try {
      const response = await fetch(`/api/member/delete?id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        setMembers((prev) => prev.filter((member) => member.id !== id));
      }
    } catch (error) {
      console.error('Error deleting member:', error);
    }
  };

  return (
    <div className={styles.appShell}>
      <a href="#main-content" className={styles.skipLink}>
        Sari la conținut
      </a>
      <header className={styles.masthead}>
        <div className={styles.mastheadInner}>
          <div className={styles.brand}>
            <Link href="/" className={styles.brandName}>
              Vă Ajutăm din Dej
            </Link>
            <p className={styles.brandSub}>Panou de administrare — noutăți, proiecte și echipă</p>
          </div>
          <div className={styles.mastheadActions}>
            <a href="https://vaajutamdindej.ro" target="_blank" rel="noopener noreferrer">
              Deschide site-ul public
            </a>
            <span aria-hidden>·</span>
            <a href="https://vaajutamdindej.ro/cum-pot-ajuta" target="_blank" rel="noopener noreferrer">
              Cum poți ajuta
            </a>
          </div>
        </div>
      </header>

      <div id="main-content" className={styles.container}>
        <h1 className={styles.title}>Gestionare conținut</h1>
        <p className={styles.subtitle}>
          Editează sau șterge postări, proiecte și membri. Folosește butoanele de mai jos pentru a
          adăuga conținut nou.
        </p>

        <ul className={styles.sectionNav} aria-label="Secțiuni">
          <li>
            <a href="#posts">Noutăți (blog)</a>
          </li>
          <li>
            <a href="#projects">Proiecte</a>
          </li>
          <li>
            <a href="#members">Membri / echipă</a>
          </li>
        </ul>

        <div className={styles.createStrip}>
          <span className={styles.createStripLabel}>Conținut nou</span>
          <div className={styles.createButtons}>
            <Link href="/post/create" className={styles.createButton}>
              Postare nouă
            </Link>
            <Link href="/project/create" className={`${styles.createButton} ${styles.createButtonTeal}`}>
              Proiect nou
            </Link>
            <Link href="/member/create" className={styles.createButton}>
              Membru nou
            </Link>
          </div>
        </div>

        <section id="posts" className={styles.section} aria-labelledby="sec-posts">
          <div className={styles.sectionHeader}>
            <h2 id="sec-posts">Noutăți</h2>
            <p className={styles.sectionIntro}>
              Articole afișate pe site în secțiunea de noutăți. Click pe <strong>Editează</strong>{' '}
              pentru a modifica tot textul, linkul sau data.
            </p>
          </div>
          <div className={styles.gallery}>
            {posts.length === 0 ? (
              <div className={styles.empty}>
                <strong>Nu există postări.</strong>
                Adaugă una cu „Postare nouă” sau publică o noutate pe care ai pregătit-o deja.
              </div>
            ) : (
              posts.map((post) => (
                <article key={post.id} className={styles.item}>
                  <h3>{post.title}</h3>
                  <p className={styles.excerpt}>
                    {post.content.length > 200 ? `${post.content.substring(0, 200)}…` : post.content}
                  </p>
                  <p className={styles.meta}>
                    <strong>Data:</strong> {new Date(post.date).toLocaleDateString('ro-RO')}
                  </p>
                  <p className={styles.meta}>
                    <strong>Facebook:</strong>{' '}
                    {post.link ? (
                      <a href={post.link} target="_blank" rel="noopener noreferrer">
                        deschide linkul
                      </a>
                    ) : (
                      '—'
                    )}
                  </p>
                  <div className={styles.actions}>
                    <Link href={`/post/edit/${post.id}`}>Editează</Link>
                    <button
                      type="button"
                      onClick={() => showDeleteConfirmation('postare', post.id, deletePost)}
                    >
                      Șterge
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section id="projects" className={styles.section} aria-labelledby="sec-projects">
          <div className={styles.sectionHeader}>
            <h2 id="sec-projects">Proiecte</h2>
            <p className={styles.sectionIntro}>
              Proiecte și inițiative afișate pe site. Tipul (ex. social, educație) poate fi folosit
              la filtrare pe front-end.
            </p>
          </div>
          <div className={styles.gallery}>
            {projects.length === 0 ? (
              <div className={styles.empty}>
                <strong>Nu există proiecte.</strong>
                Adaugă primul proiect cu butonul „Proiect nou”.
              </div>
            ) : (
              projects.map((project) => (
                <article key={project.id} className={styles.item}>
                  <h3>{project.title}</h3>
                  <p className={styles.excerpt}>
                    {project.content.length > 200
                      ? `${project.content.substring(0, 200)}…`
                      : project.content}
                  </p>
                  <p className={styles.meta}>
                    <strong>Tip:</strong> {project.type}
                  </p>
                  <div className={styles.actions}>
                    <Link href={`/project/edit/${project.id}`}>Editează</Link>
                    <button
                      type="button"
                      onClick={() => showDeleteConfirmation('proiect', project.id, deleteProject)}
                    >
                      Șterge
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section id="members" className={styles.section} aria-labelledby="sec-members">
          <div className={styles.sectionHeader}>
            <h2 id="sec-members">Membri &amp; echipă</h2>
            <p className={styles.sectionIntro}>
              Membri afișați în pagina de echipă. Bifa „consiliu” se reflectă pe site dacă este
              folosită de front-end.
            </p>
          </div>
          <div className={styles.gallery}>
            {members.length === 0 ? (
              <div className={styles.empty}>
                <strong>Nu există membri.</strong>
                Adaugă o înregistrare cu „Membru nou”.
              </div>
            ) : (
              members.map((member) => (
                <article key={member.id} className={styles.item}>
                  <h3>{member.name}</h3>
                  <p className={styles.meta}>
                    <strong>Statut / rol:</strong> {member.status}
                  </p>
                  <p className={styles.meta}>
                    <strong>Membru consiliu:</strong> {member.is_council ? 'Da' : 'Nu'}
                  </p>
                  <p className={styles.meta}>
                    <strong>Facebook:</strong>{' '}
                    {member.link ? (
                      <a href={member.link} target="_blank" rel="noopener noreferrer">
                        deschide linkul
                      </a>
                    ) : (
                      '—'
                    )}
                  </p>
                  <div className={styles.actions}>
                    <Link href={`/member/edit/${member.id}`}>Editează</Link>
                    <button
                      type="button"
                      onClick={() => showDeleteConfirmation('membru', member.id, deleteMember)}
                    >
                      Șterge
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>

      <footer className={styles.footer}>
        <span>© {new Date().getFullYear()} Vă Ajutăm din Dej — asociație caritabilă, Dej, Cluj</span>
        {' · '}
        <a href="https://vaajutamdindej.ro" target="_blank" rel="noopener noreferrer">
          vaajutamdindej.ro
        </a>
      </footer>

      <ConfirmationPopup
        isOpen={popupState.isOpen}
        onClose={closePopup}
        onConfirm={popupState.onConfirm}
        message={popupState.message}
      />
    </div>
  );
}
