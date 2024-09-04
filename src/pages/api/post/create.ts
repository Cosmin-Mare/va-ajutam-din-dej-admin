import { NextApiRequest, NextApiResponse } from 'next';
import { Connection, ConnectionConfiguration, Request, TYPES } from 'tedious';

const config = {
  server: process.env.AZURE_SQL_SERVER,
  authentication: {
    type: 'default',
    options: {
      userName: process.env.AZURE_SQL_USERNAME + "@" + process.env.AZURE_SQL_SERVER,
      password: process.env.AZURE_SQL_PASSWORD,
    },
  },
  options: {
    database: process.env.AZURE_SQL_DATABASE,
    encrypt: true,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { title, content, link } = req.body;

  if (!title || !content || !link) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const connection = new Connection(config as ConnectionConfiguration);

  connection.on('connect', (err) => {
    if (err) {
      console.error('Connection error:', err);
      return res.status(500).json({ message: 'Database connection error' });
    }

    const query = `
      INSERT INTO VaAjutamDinDej.posts (title, content, date, link)
      VALUES (@title, @content, GETDATE(), @link);
      SELECT SCOPE_IDENTITY() AS newPostId;
    `;

    const request = new Request(query, (err, rowCount) => {
      if (err) {
        console.error('Query error:', err);
        return res.status(500).json({ message: 'Error creating post' });
      }

      console.log("Row count:", rowCount);
    });

    request.on('row', (columns) => {
      console.log('Row received:');
      columns.forEach((column: { metadata: { colName: string }, value: any }) => {
        console.log(column.metadata.colName, column.value);
      });
    });

    request.on('done', (rowCount) => {
      console.log('Done event fired. Row count:', rowCount);
    });

    request.on('requestCompleted', () => {
      console.log('Request completed');
      res.status(201).json({ message: 'Post created successfully' });
    });

    request.addParameter('title', TYPES.NVarChar, title);
    request.addParameter('content', TYPES.NVarChar, content);
    request.addParameter('link', TYPES.NVarChar, link);

    connection.execSql(request);
  });

  connection.connect();
}