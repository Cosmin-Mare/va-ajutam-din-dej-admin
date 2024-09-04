import { NextApiRequest, NextApiResponse } from 'next';
import { Connection, ConnectionConfiguration, Request, TYPES } from 'tedious';

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

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ message: 'Missing post ID' });
  }

  const connection = new Connection(config as ConnectionConfiguration);

  connection.on('connect', (err) => {
    if (err) {
      console.error('Connection error:', err);
      return res.status(500).json({ message: 'Database connection error' });
    }

    const query = `
      SELECT id, title, content, date, link
      FROM VaAjutamDinDej.posts
      WHERE id = @id;
    `;

    const request = new Request(query, (err) => {
      if (err) {
        console.error('Query error:', err);
        return res.status(500).json({ message: 'Error fetching post' });
      }
    });

    let post: any = null;

    request.on('row', (columns) => {
      post = {
        id: columns[0].value,
        title: columns[1].value,
        content: columns[2].value,
        date: columns[3].value,
        link: columns[4].value,
      };
    });

    request.on('requestCompleted', () => {
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      console.log("Parsed post:", JSON.stringify(post, null, 2));
      res.status(200).json(post);
      connection.close();
    });

    request.addParameter('id', TYPES.Int, parseInt(id as string, 10));

    connection.execSql(request);
  });

  connection.connect();
}
