import { useState, useEffect, useMemo } from 'react';
import styles from './index.module.css';
import Link from 'next/link';
import AdminNav, { HOME_FIXED_HEADER_ID } from '@/components/AdminNav';

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

interface SponsorPartner {
  id: number;
  name: string;
  websiteUrl: string;
  role: 'sponsor' | 'partner';
  sortKey: number;
  logoUrl?: string;
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

type SPRow = SponsorPartner;
function PartnerSponsorItem({
  sp,
  onDeleteClick,
}: {
  sp: SPRow;
  onDeleteClick: (id: number) => void;
}) {
  return (
    <article className={styles.item}>
      <h3>{sp.name}</h3>
      <p className={styles.meta}>
        <strong>Ordine:</strong> {sp.sortKey}
      </p>
      <p className={styles.meta}>
        <strong>Site:</strong>{' '}
        {sp.websiteUrl ? (
          <a href={sp.websiteUrl} target="_blank" rel="noopener noreferrer">
            {sp.websiteUrl}
          </a>
        ) : (
          '—'
        )}
      </p>
      {sp.logoUrl ? (
        <p className={styles.meta}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={sp.logoUrl}
            alt=""
            style={{ maxHeight: 48, maxWidth: 160, objectFit: 'contain' }}
          />
        </p>
      ) : null}
      <div className={styles.actions}>
        <Link href={`/sponsor-partner/edit/${sp.id}`}>Editează</Link>
        <button type="button" onClick={() => onDeleteClick(sp.id)}>
          Șterge
        </button>
      </div>
    </article>
  );
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [sponsorPartners, setSponsorPartners] = useState<SponsorPartner[]>([]);
  const [popupState, setPopupState] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    message: '',
    onConfirm: () => {},
  });

  const sponsorsList = useMemo(
    () => sponsorPartners.filter((r) => r.role === 'sponsor'),
    [sponsorPartners]
  );
  const partnersList = useMemo(
    () => sponsorPartners.filter((r) => r.role === 'partner'),
    [sponsorPartners]
  );

  useEffect(() => {
    fetchPosts();
    fetchProjects();
    fetchMembers();
    fetchSponsorPartners();
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

  const fetchSponsorPartners = async () => {
    try {
      const response = await fetch('/api/sponsor-partner/get-all');
      if (response.ok) {
        const data = (await response.json()) as SponsorPartner[];
        setSponsorPartners(data);
      }
    } catch (error) {
      console.error('Error fetching sponsors/partners:', error);
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

  const deleteSponsorPartner = async (id: number) => {
    try {
      const response = await fetch(`/api/sponsor-partner/delete?id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        setSponsorPartners((prev) => prev.filter((row) => row.id !== id));
      }
    } catch (error) {
      console.error('Error deleting sponsor/partener:', error);
    }
  };

  return (
    <div className={styles.appShell}>
      <a href="#main-content" className={styles.skipLink}>
        Sari la conținut
      </a>
      <header className={styles.appTopBar} id={HOME_FIXED_HEADER_ID}>
        <div className={styles.appTopRow}>
          <Link href="/" className={styles.appTopBrand}>
            Vă Ajutăm din Dej
          </Link>
          <div className={styles.appTopNavRegion}>
            <AdminNav variant="home" />
          </div>
          <div className={styles.appTopRight}>
            <a
              className={styles.appTopExt}
              href="https://vaajutamdindej.ro"
              target="_blank"
              rel="noopener noreferrer"
            >
              Site public
            </a>
            <a
              className={styles.appTopExt}
              href="https://vaajutamdindej.ro/cum-pot-ajuta"
              target="_blank"
              rel="noopener noreferrer"
            >
              Cum poți ajuta
            </a>
          </div>
        </div>
      </header>

      <div id="main-content" className={`${styles.container} ${styles.mainBelowFixedBar}`}>
        <h1 className={styles.title}>Gestionare conținut</h1>
        <p className={styles.subtitle}>
          Editează sau șterge conținutul din secțiunile de mai jos. Pentru înregistrări noi, folosește
          rutele de create din editor:{' '}
          <Link href="/post/create">noutate</Link>, <Link href="/project/create">proiect</Link>,{' '}
          <Link href="/member/create">membru</Link>,{' '}
          <Link href="/sponsor-partner/create?role=sponsor">sponsor</Link>,{' '}
          <Link href="/sponsor-partner/create?role=partner">partener</Link>.
        </p>

        <section id="posts" className={styles.section} aria-labelledby="sec-posts">
          <div className={styles.sectionHeader}>
            <h2 id="sec-posts">Noutăți</h2>
            <p className={styles.sectionIntro}>
              Articole afișate pe site în secțiunea de noutăți. „Postare nouă” deschide editorul cu
              salvare automată; din listă, <strong>Editează</strong> pentru text, dată, link și
              imagini.
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
              Proiecte și inițiative afișate pe site. „Proiect nou” deschide editorul cu salvare
              automată și imagini în panoul lateral; din listă, <strong>Editează</strong> pentru
              detalii.
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
              Membri afișați în pagina de echipă. „Membru nou” deschide editorul cu salvare
              automată și fotografie în lateral; bifa „consiliu” și restul câmpurilor se editează acolo
              sau din <strong>Editează</strong>.
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

        <section id="sponsors" className={styles.section} aria-labelledby="sec-sponsors">
          <div className={styles.sectionHeader}>
            <h2 id="sec-sponsors">Sponsori</h2>
            <p className={styles.sectionIntro}>
              Logo-uri în grila <strong>Sponsori</strong> de pe <strong>/parteneri</strong> (părți de
              sus a paginii când conținutul vine din Firestore). Ordinea e separată de cea a
              partenerilor.
            </p>
          </div>
          <div className={styles.gallery}>
            {sponsorsList.length === 0 ? (
              <div className={styles.empty}>
                <strong>Nu există sponsori în listă.</strong> Adaugă un sponsor sau, dacă nu există
                niciun rând în colecție, site-ul poate arăta varianta statică a paginii.
              </div>
            ) : (
              sponsorsList.map((sp) => (
                <PartnerSponsorItem
                  key={sp.id}
                  sp={sp}
                  onDeleteClick={(id) =>
                    showDeleteConfirmation('sponsor', id, deleteSponsorPartner)
                  }
                />
              ))
            )}
          </div>
        </section>

        <section id="partners" className={styles.section} aria-labelledby="sec-partners">
          <div className={styles.sectionHeader}>
            <h2 id="sec-partners">Parteneri</h2>
            <p className={styles.sectionIntro}>
              Asociații și organizații din grila <strong>Parteneri</strong> (jumătatea de jos a paginii
              publice). Ordine și coloană separată față de sponsori.
            </p>
          </div>
          <div className={styles.gallery}>
            {partnersList.length === 0 ? (
              <div className={styles.empty}>
                <strong>Nu există parteneri în listă.</strong> Adaugă un partener aici; tipul (sponsor
                vs partener) poți alege și în editor.
              </div>
            ) : (
              partnersList.map((sp) => (
                <PartnerSponsorItem
                  key={sp.id}
                  sp={sp}
                  onDeleteClick={(id) =>
                    showDeleteConfirmation('partener', id, deleteSponsorPartner)
                  }
                />
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
