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
    const members = await queryDatabase();
    res.status(200).json(members);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

interface Member {
  id: number;
  name: string;
  status: string;
  is_council: boolean;
}

function queryDatabase(): Promise<Member[]> {
  return new Promise((resolve, reject) => {
    const connection = new Connection(config as ConnectionConfiguration);
    
    connection.on('connect', (err) => {
      if (err) {
        console.error('Connection error:', err);
        reject(err);
        return;
      }

      const query = `
        SELECT id, name, status, is_council
        FROM VaAjutamDinDej.members
        ORDER BY name;
      `;

      const members: Member[] = [];

      const request = new Request(query, (err, rowCount) => {
        console.log(rowCount)
        if (err) {
          console.error('Query error:', err);
          reject(err);
          return;
        }

        connection.close();
        resolve(members);
      });

      request.on('row', (columns) => {
        const member: Member = {
          id: columns[0].value as number,
          name: columns[1].value as string,
          status: columns[2].value as string,
          is_council: columns[3].value as boolean,
        };
        members.push(member);
      });

      connection.execSql(request);
    });

    connection.connect();
  });
}