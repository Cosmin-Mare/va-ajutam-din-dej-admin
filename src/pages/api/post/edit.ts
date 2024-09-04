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
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { id, title, content, link, date } = req.body;

  if (!id || !title || !content || !link || !date) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const connection = new Connection(config as ConnectionConfiguration);

  connection.on('connect', (err) => {
    if (err) {
      console.error('Connection error:', err);
      return res.status(500).json({ message: 'Database connection error' });
    }

    const query = `
      UPDATE VaAjutamDinDej.posts
      SET title = @title, content = @content, link = @link, date = @date
      WHERE id = @id;
      SELECT @@ROWCOUNT AS updatedCount;
    `;

    const request = new Request(query, (err, rowCount, rows) => {
      if (err) {
        console.error('Query error:', err);
        return res.status(500).json({ message: 'Error updating post' });
      }
      console.log("Rows:", rows);
      console.log("Row count:", rowCount);

      if (rowCount === 0) {
        return res.status(404).json({ message: 'Post not found' });
      }

      res.status(200).json({ message: 'Post updated successfully' });
    }); 

    request.addParameter('id', TYPES.Int, id);
    request.addParameter('title', TYPES.NVarChar, title);
    request.addParameter('content', TYPES.NVarChar, content);
    request.addParameter('link', TYPES.NVarChar, link);
    request.addParameter('date', TYPES.DateTime, new Date(date));

    connection.execSql(request);
  });

  connection.connect();
}