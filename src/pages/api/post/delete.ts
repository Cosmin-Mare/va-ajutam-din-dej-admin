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
  if (req.method !== 'DELETE') {
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
      DELETE FROM VaAjutamDinDej.posts
      WHERE id = @id;
      SELECT @@ROWCOUNT AS deletedCount;
    `;

    const request = new Request(query, (err, rowCount) => {
      if (err) {
        console.error('Query error:', err);
        return res.status(500).json({ message: 'Error deleting post' });
      }

      console.log("Row count:", rowCount);

      if (rowCount === 0) {
        return res.status(404).json({ message: 'Post not found' });
      }

      res.status(200).json({ message: 'Post deleted successfully' });
    });

    request.addParameter('id', TYPES.Int, parseInt(id as string, 10));

    connection.execSql(request);
  });

  connection.connect();
}