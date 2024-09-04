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
  console.log('Received request for project ID:', id);

  if (!id) {
    return res.status(400).json({ message: 'Missing project ID' });
  }

  const connection = new Connection(config as ConnectionConfiguration);

  connection.on('connect', (err) => {
    if (err) {
      console.error('Connection error:', err);
      return res.status(500).json({ message: 'Database connection error' });
    }

    console.log('Connected to database');

    const query = `
      SELECT id, title, content, type
      FROM VaAjutamDinDej.projects
      WHERE id = @id;
    `;

    const request = new Request(query, (err) => {
      if (err) {
        console.error('Query error:', err);
        return res.status(500).json({ message: 'Error fetching project' });
      }
    });

    let project: any = null;

    request.on('row', (columns) => {
      project = {
        id: columns[0].value,
        title: columns[1].value,
        content: columns[2].value,
        type: columns[3].value,
      };
      console.log('Project found:', project);
    });

    request.on('requestCompleted', () => {
      if (!project) {
        console.log('Project not found');
        return res.status(404).json({ message: 'Project not found' });
      }

      console.log('Sending project data');
      res.status(200).json(project);
      connection.close();
    });

    request.addParameter('id', TYPES.Int, parseInt(id as string, 10));

    connection.execSql(request);
  });

  connection.connect();
}