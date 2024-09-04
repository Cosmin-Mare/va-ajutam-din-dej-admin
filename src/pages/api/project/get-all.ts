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
    const projects = await queryDatabase();
    res.status(200).json(projects);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

interface Project {
  [key: string]: any;
}

function queryDatabase(): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const connection = new Connection(config as ConnectionConfiguration);
    
    connection.on('connect', (err) => {
      if (err) {
        console.error('Connection error:', err);
        reject(err);
        return;
      }

      const query = `
        SELECT *
        FROM VaAjutamDinDej.projects
      `;

      const projects: Project[] = [];

      const request = new Request(query, (err, rowCount) => {
        if (err) {
          console.error('Query error:', err);
          reject(err);
          return;
        }
        connection.close();
        resolve(projects);
      });

      request.on('row', (columns) => {
        const project: { [key: string]: any } = {};
        columns.forEach((column: { metadata: { colName: string }, value: any }) => {
          project[column.metadata.colName] = column.value;
        });
        projects.push(project);
      });

      connection.execSql(request);
    });

    connection.connect();
  });
}
