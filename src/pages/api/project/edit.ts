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

  const { id, title, content, type } = req.body;

  if (!id || !title || !content || !type) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const connection = new Connection(config as ConnectionConfiguration);

  connection.on('connect', (err) => {
    if (err) {
      console.error('Connection error:', err);
      return res.status(500).json({ message: 'Database connection error' });
    }

    const query = `
      UPDATE VaAjutamDinDej.projects
      SET title = @title, content = @content, type = @type
      WHERE id = @id;
      SELECT @@ROWCOUNT AS updatedCount;
    `;

    const request = new Request(query, (err, rowCount, rows) => {
      if (err) {
        console.error('Query error:', err);
        return res.status(500).json({ message: 'Error updating project' });
      }
      console.log("Rows:", rows);
      console.log("Row count:", rowCount);

      if (rowCount === 0) {
        return res.status(404).json({ message: 'Project not found' });
      }

      res.status(200).json({ message: 'Project updated successfully' });
    }); 

    request.addParameter('id', TYPES.Int, id);
    request.addParameter('title', TYPES.NVarChar, title);
    request.addParameter('content', TYPES.NVarChar, content);
    request.addParameter('type', TYPES.NVarChar, type);

    connection.execSql(request);
  });

  connection.connect();
}