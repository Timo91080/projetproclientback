import jwt from 'jsonwebtoken';
import { getConnection } from '../config/database.js';

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify admin still exists in database
    const connection = getConnection();
    const [admin] = await connection.execute(
      'SELECT id_admin, email, nom, prenom FROM admin WHERE id_admin = ?',
      [decoded.adminId]
    );

    if (admin.length === 0) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.admin = {
      id: admin[0].id_admin,
      email: admin[0].email,
      nom: admin[0].nom,
      prenom: admin[0].prenom
    };
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
}