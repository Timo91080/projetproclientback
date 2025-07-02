import express from 'express';
import bcrypt from 'bcrypt';
import { body, validationResult } from 'express-validator';
import { getConnection } from '../config/database.js';
import { authenticateClientToken } from '../middleware/clientAuth.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification client
router.use(authenticateClientToken);

// Obtenir le profil du client connecté
router.get('/profile', async (req, res) => {
  try {
    const connection = getConnection();
    const [client] = await connection.execute(
      'SELECT id_client, nom, prenom, email FROM client WHERE id_client = ?',
      [req.client.id_client]
    );

    if (client.length === 0) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.json(client[0]);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Mettre à jour le profil du client
router.put('/profile', [
  body('nom').trim().isLength({ min: 2 }),
  body('prenom').trim().isLength({ min: 2 }),
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { nom, prenom, email } = req.body;
    const connection = getConnection();

    // Vérifier si l'email existe déjà pour un autre client
    const [existingClient] = await connection.execute(
      'SELECT id_client FROM client WHERE email = ? AND id_client != ?',
      [email, req.client.id_client]
    );

    if (existingClient.length > 0) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    // Mettre à jour le profil
    const [result] = await connection.execute(
      'UPDATE client SET nom = ?, prenom = ?, email = ? WHERE id_client = ?',
      [nom, prenom, email, req.client.id_client]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Retourner le profil mis à jour
    const [updatedClient] = await connection.execute(
      'SELECT id_client, nom, prenom, email FROM client WHERE id_client = ?',
      [req.client.id_client]
    );

    res.json(updatedClient[0]);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Obtenir les réservations du client
router.get('/reservations', async (req, res) => {
  try {
    const connection = getConnection();
    const [reservations] = await connection.execute(`
      SELECT 
        r.id_reservation,
        r.date_reservation,
        r.heure_debut,
        r.heure_fin,
        r.statut,
        s.nom_station,
        s.type_station
      FROM client_reservation cr
      JOIN reservation r ON cr.id_reservation = r.id_reservation
      JOIN station s ON r.id_station = s.id_station
      WHERE cr.id_client = ?
      ORDER BY r.date_reservation DESC, r.heure_debut DESC
    `, [req.client.id_client]);

    res.json(reservations);
  } catch (error) {
    console.error('Error fetching client reservations:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Obtenir les sessions du client
router.get('/sessions', async (req, res) => {
  try {
    const connection = getConnection();
    const [sessions] = await connection.execute(`
      SELECT 
        s.id_session,
        s.heure_debut,
        s.heure_fin,
        s.duree_session,
        s.cout_total,
        st.nom_station,
        st.type_station,
        r.date_reservation
      FROM session s
      JOIN station st ON s.id_station = st.id_station
      LEFT JOIN reservation r ON s.id_reservation = r.id_reservation
      WHERE s.id_client = ?
      ORDER BY s.heure_debut DESC
    `, [req.client.id_client]);

    res.json(sessions);
  } catch (error) {
    console.error('Error fetching client sessions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
