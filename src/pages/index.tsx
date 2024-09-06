import { useState, useEffect } from 'react';
import styles from "./index.module.css";
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
}

interface ConfirmationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  message: string;
}

const ConfirmationPopup: React.FC<ConfirmationPopupProps> = ({ isOpen, onClose, onConfirm, message }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.popupOverlay}>
      <div className={styles.popup}>
        <p>{message}</p>
        <div className={styles.popupActions}>
          <button onClick={onConfirm}>Confirm</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [popupState, setPopupState] = useState<{ isOpen: boolean; message: string; onConfirm: () => void }>({
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

  const showDeleteConfirmation = (type: string, id: number, deleteFunction: (id: number) => Promise<void>) => {
    setPopupState({
      isOpen: true,
      message: `Are you sure you want to delete this ${type}?`,
      onConfirm: () => {
        deleteFunction(id);
        setPopupState({ ...popupState, isOpen: false });
      },
    });
  };

  const closePopup = () => {
    setPopupState({ ...popupState, isOpen: false });
  };

  const deletePost = async (id: number) => {
    try {
      const response = await fetch(`/api/post/delete?id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        setPosts(posts.filter(post => post.id !== id));
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const deleteProject = async (id: number) => {
    try {
      const response = await fetch(`/api/project/delete?id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        setProjects(projects.filter(project => project.id !== id));
      }
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const deleteMember = async (id: number) => {
    try {
      const response = await fetch(`/api/member/delete?id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        setMembers(members.filter(member => member.id !== id));
      }
    } catch (error) {
      console.error('Error deleting member:', error);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Editeaza postari, proiecte si membri</h1>

      <div className={styles.createButtons}>
        <Link href="/post/create" className={styles.createButton}>Create New Post</Link>
        <Link href="/project/create" className={styles.createButton}>Create New Project</Link>
        <Link href="/member/create" className={styles.createButton}>Create New Member</Link>
      </div>

      <section id="posts" className={styles.section}>
        <h2>Blog Posts</h2>
        <div className={styles.gallery}>
          {posts.map((post) => (
            <div key={post.id} className={styles.item}>
              <h3>{post.title}</h3>
              <p>{post.content.substring(0, 100)}...</p>
              <p>Date: {new Date(post.date).toLocaleDateString()}</p>
              <div className={styles.actions}>
                <Link href={`/post/edit/${post.id}`}>Edit</Link>
                <button onClick={() => showDeleteConfirmation('post', post.id, deletePost)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="projects" className={styles.section}>
        <h2>Projects</h2>
        <div className={styles.gallery}>
          {projects.map((project) => (
            <div key={project.id} className={styles.item}>
              <h3>{project.title}</h3>
              <p>{project.content.substring(0, 100)}...</p>
              <p>Type: {project.type}</p>
              <div className={styles.actions}>
                <Link href={`/project/edit/${project.id}`}>Edit</Link>
                <button onClick={() => showDeleteConfirmation('project', project.id, deleteProject)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="members" className={styles.section}>
        <h2>Members</h2>
        <div className={styles.gallery}>
          {members.map((member) => (
            <div key={member.id} className={styles.item}>
              <h3>{member.name}</h3>
              <p>Status: {member.status}</p>
              <p>Council Member: {member.is_council ? 'Yes' : 'No'}</p>
              <div className={styles.actions}>
                <Link href={`/member/edit/${member.id}`}>Edit</Link>
                <button onClick={() => showDeleteConfirmation('member', member.id, deleteMember)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <ConfirmationPopup
        isOpen={popupState.isOpen}
        onClose={closePopup}
        onConfirm={popupState.onConfirm}
        message={popupState.message}
      />
    </div>
  );
}
