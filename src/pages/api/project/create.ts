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
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { title, content, type } = req.body;

  if (!title || !content || !type) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const connection = new Connection(config as ConnectionConfiguration);

  connection.on('connect', (err) => {
    if (err) {
      console.error('Connection error:', err);
      return res.status(500).json({ message: 'Database connection error' });
    }

    let newProjectId: number | null = null;

    const query = `
      INSERT INTO VaAjutamDinDej.projects (title, content, type)
      VALUES (@title, @content, @type);
      SELECT SCOPE_IDENTITY() AS id;
    `;

    const request = new Request(query, (err) => {
      if (err) {
        console.error('Query error:', err);
        return res.status(500).json({ message: 'Error creating project', error: err.message });
      }

      if (newProjectId === null) {
        return res.status(500).json({ message: 'Project created but ID not returned' });
      }

      res.status(201).json({ message: 'Project created successfully', id: newProjectId });
    });

    request.addParameter('title', TYPES.NVarChar, title);
    request.addParameter('content', TYPES.NVarChar, content);
    request.addParameter('type', TYPES.NVarChar, type);

    request.on('row', (columns) => {
      if (columns && columns[0]) {
        newProjectId = columns[0].value as number;
      }
    });

    connection.execSql(request);
  });

  connection.connect();
}