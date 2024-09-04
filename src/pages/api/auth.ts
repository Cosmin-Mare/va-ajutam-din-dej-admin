import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { username, password } = req.body;
  console.log(username, password);
  console.log(process.env.ADMIN_USERNAME, process.env.ADMIN_PASSWORD);
  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    res.setHeader('Set-Cookie', 'admin_session=true; HttpOnly; Path=/; Max-Age=86400');
    return res.status(200).json({ success: true });
  } else {
    return res.status(401).json({ message: 'Nume de utilizator sau parolă incorectă' });
  }
}
