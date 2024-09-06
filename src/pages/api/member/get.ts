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
    return res.status(400).json({ message: 'Missing member ID' });
  }

  const connection = new Connection(config as ConnectionConfiguration);

  connection.on('connect', (err) => {
    if (err) {
      console.error('Connection error:', err);
      return res.status(500).json({ message: 'Database connection error' });
    }

    const query = `
      SELECT id, name, status, is_council
      FROM VaAjutamDinDej.members
      WHERE id = @id;
    `;

    const request = new Request(query, (err) => {
      if (err) {
        console.error('Query error:', err);
        return res.status(500).json({ message: 'Error fetching member' });
      }
    });

    let member: any = null;

    request.on('row', (columns) => {
      member = {
        id: columns[0].value as number,
        name: columns[1].value as string,
        status: columns[2].value as string,
        is_council: columns[3].value as boolean,
      };
    });

    request.on('requestCompleted', () => {
      if (!member) {
        return res.status(404).json({ message: 'Member not found' });
      }

      res.status(200).json(member);
      connection.close();
    });

    request.addParameter('id', TYPES.Int, parseInt(id as string, 10));

    connection.execSql(request);
  });

  connection.connect();
}
