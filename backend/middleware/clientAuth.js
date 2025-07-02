import jwt from 'jsonwebtoken';
import { getConnection } from '../config/database.js';

export async function authenticateClientToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify client still exists in database
    const connection = getConnection();
    const [client] = await connection.execute(
      'SELECT id_client, email, nom, prenom FROM client WHERE id_client = ?',
      [decoded.clientId]
    );

    if (client.length === 0) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.client = client[0];
    next();
  } catch (error) {
    console.error('Client token verification error:', error);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
}
