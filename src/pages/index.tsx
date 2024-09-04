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

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    fetchPosts();
    fetchProjects();
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

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Welcome to My Portfolio</h1>

      <div className={styles.createButtons}>
        <Link href="/post/create" className={styles.createButton}>Create New Post</Link>
        <Link href="/project/create" className={styles.createButton}>Create New Project</Link>
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
                <button onClick={() => deletePost(post.id)}>Delete</button>
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
                <button onClick={() => deleteProject(project.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
