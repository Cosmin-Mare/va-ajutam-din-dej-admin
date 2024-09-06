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

  const { name, status, is_council } = req.body;

  if (!name || !status || is_council === undefined) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const connection = new Connection(config as ConnectionConfiguration);

  connection.on('connect', (err) => {
    if (err) {
      console.error('Connection error:', err);
      return res.status(500).json({ message: 'Database connection error' });
    }

    const query = `
      INSERT INTO VaAjutamDinDej.members (name, status, is_council)
      VALUES (@name, @status, @is_council);
      SELECT SCOPE_IDENTITY() AS id;
    `;

    const request = new Request(query, (err) => {
      if (err) {
        console.error('Query error:', err);
        return res.status(500).json({ message: 'Error creating member' });
      }
    });

    request.addParameter('name', TYPES.NVarChar, name);
    request.addParameter('status', TYPES.NVarChar, status);
    request.addParameter('is_council', TYPES.Bit, is_council);

    request.on('row', (columns) => {
      const newMemberId = columns[0].value;
      res.status(201).json({ message: 'Member created successfully', id: newMemberId });
    });

    connection.execSql(request);
  });

  connection.connect();
}
