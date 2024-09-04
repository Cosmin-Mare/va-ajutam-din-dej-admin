import { NextApiRequest, NextApiResponse } from 'next';
import { Connection, ConnectionConfiguration, Request } from 'tedious';

const config = {
  server: process.env.AZURE_SQL_SERVER,
  authentication: {
    type: 'default',
    options: {
      userName: process.env.AZURE_SQL_USERNAME,
      password: process.env.AZURE_SQL_PASSWORD,
    },
  },
  options: {
    database: process.env.AZURE_SQL_DATABASE,
    encrypt: true,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const posts = await queryDatabase();
    res.status(200).json(posts);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

interface Post {
  id: number;
  title: string;
  content: string;
  date: Date;
  link: string;
}

function queryDatabase(): Promise<Post[]> {
  return new Promise((resolve, reject) => {
    const connection = new Connection(config as ConnectionConfiguration);
    
    connection.on('connect', (err) => {
      if (err) {
        console.error('Connection error:', err);
        reject(err);
        return;
      }

      const query = `
        SELECT id, title, content, date, link
        FROM VaAjutamDinDej.posts
        ORDER BY date DESC;
      `;

      const posts: Post[] = [];

      const request = new Request(query, (err, rowCount) => {
        if (err) {
          console.error('Query error:', err);
          reject(err);
          return;
        }

        connection.close();
        resolve(posts);
      });

      request.on('row', (columns) => {
        const post: Post = {
          id: columns[0].value as number,
          title: columns[1].value as string,
          content: columns[2].value as string,
          date: columns[3].value as Date,
          link: columns[4].value as string,
        };
        posts.push(post);
      });

      connection.execSql(request);
    });

    connection.connect();
  });
}
