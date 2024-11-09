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

  const { id, name, status, is_council, link } = req.body;

  if (!id || !name || !status || is_council === undefined || !link) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const connection = new Connection(config as ConnectionConfiguration);

  connection.on('connect', (err) => {
    if (err) {
      console.error('Connection error:', err);
      return res.status(500).json({ message: 'Database connection error' });
    }

    const query = `
      UPDATE VaAjutamDinDej.members_fb_link
      SET name = @name, status = @status, is_council = @is_council, link = @link
      WHERE id = @id;
      SELECT @@ROWCOUNT AS updatedCount;
    `;

    const request = new Request(query, (err, rowCount) => {
      if (err) {
        console.error('Query error:', err);
        return res.status(500).json({ message: 'Error updating member' });
      }

      if (rowCount === 0) {
        return res.status(404).json({ message: 'Member not found' });
      }

      res.status(200).json({ message: 'Member updated successfully' });
    });

    request.addParameter('id', TYPES.Int, id);
    request.addParameter('name', TYPES.NVarChar, name);
    request.addParameter('status', TYPES.NVarChar, status);
    request.addParameter('is_council', TYPES.Bit, is_council);
    request.addParameter('link', TYPES.NVarChar, link);
    

    connection.execSql(request);
  });

  connection.connect();
}
