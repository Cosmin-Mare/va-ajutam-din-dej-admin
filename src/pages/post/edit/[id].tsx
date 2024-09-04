import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '@/styles/form.module.css';

interface Post {
  id: number;
  title: string;
  content: string;
  link: string;
}

export default function EditPost() {
  const [post, setPost] = useState<Post | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [link, setLink] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    console.log("useEffect triggered, id:", id);
    if (id && typeof id === 'string') {
      fetchPost(id);
    }
  }, [id]);

  const fetchPost = async (postId: string) => {
    console.log("Fetching post with id:", postId);
    setIsLoading(true);
    try {
      const response = await fetch(`/api/post/get?id=${postId}`);
      console.log("Fetch response:", response);
      if (response.ok) {
        const data = await response.json();
        console.log("Fetched data:", data);
        setPost(data);
        setTitle(data.title);
        setContent(data.content);
        setLink(data.link);
      } else {
        setError('Failed to fetch post');
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      setError('An error occurred while fetching the post');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/post/edit', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, title, content, link }),
      });

      if (response.ok) {
        router.push('/');
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to update post');
      }
    } catch (error) {
      console.error('Error updating post:', error);
      setError('An error occurred while updating the post');
    }
  };

  if (isLoading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!post) {
    return <div className={styles.error}>Post not found</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Edit Post</h1>
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
          <label htmlFor="link">Link</label>
          <input
            type="text"
            id="link"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            required
          />
        </div>
        <button type="submit" className={styles.submitButton}>
          Update Post
        </button>
      </form>
    </div>
  );
}
