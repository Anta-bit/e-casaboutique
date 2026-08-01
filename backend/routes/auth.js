const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const auth = require('../middleware/auth');

// Inscription
router.post('/register', async (req, res) => {
  try {
    const { email, password, first_name, last_name, phone, role, company_name, tax_number, address, city, country } = req.body;
    const pool = req.pool;

    // Vérifier si l'email existe déjà
    const [existingUser] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'Email déjà utilisé' });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    const userRole = role === 'supplier' ? 'supplier' : 'client';

    // Insérer l'utilisateur
    const [result] = await pool.query(
      'INSERT INTO users (email, password, first_name, last_name, phone, role) VALUES (?, ?, ?, ?, ?, ?)',
      [email, hashedPassword, first_name, last_name, phone || null, userRole]
    );

    const userId = result.insertId;

    if (userRole === 'supplier') {
      // Insérer le profil fournisseur en attente
      await pool.query(
        'INSERT INTO suppliers (name, email, phone, address, city, country, company_name, tax_number, user_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          `${first_name} ${last_name}`.trim(),
          email,
          phone || '',
          address || '',
          city || '',
          country || 'Senegal',
          company_name || '',
          tax_number || '',
          userId,
          'pending'
        ]
      );

      return res.status(201).json({
        message: 'Votre compte fournisseur a été créé et est en attente de validation par l\'administrateur.',
        user: {
          id: userId,
          email,
          first_name,
          last_name,
          role: 'supplier',
          status: 'pending'
        },
        token: null
      });
    }

    // Générer le token pour les clients
    const token = jwt.sign(
      { id: userId, email, role: 'client' },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '30d' }
    );

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user: {
        id: userId,
        email,
        first_name,
        last_name,
        role: 'client'
      },
      token
    });
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({ message: 'Erreur lors de l\'inscription' });
  }
});

// Connexion
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const pool = req.pool;

    // Trouver l'utilisateur
    const [users] = await pool.query('SELECT id, password, role, first_name, last_name, email, status FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    const user = users[0];

    // Vérifier si le compte est suspendu
    if (user.status === 'suspended') {
      return res.status(403).json({ message: 'Votre compte a été suspendu par l\'administrateur.' });
    }

    // Si c'est un fournisseur, vérifier son approbation
    if (user.role === 'supplier') {
      const [supplierProfile] = await pool.query('SELECT status FROM suppliers WHERE user_id = ?', [user.id]);
      if (supplierProfile.length === 0 || supplierProfile[0].status === 'pending') {
        return res.status(403).json({ message: 'Votre inscription de fournisseur est en attente de validation par l\'administrateur.' });
      }
      if (supplierProfile[0].status === 'rejected') {
        return res.status(403).json({ message: 'Votre demande d\'inscription a été rejetée.' });
      }
    }

    // Vérifier le mot de passe
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Générer le token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '30d' }
    );

    res.json({
      message: 'Connexion réussie',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ message: 'Erreur lors de la connexion' });
  }
});

// Récupérer le profil de l'utilisateur
router.get('/me', auth, async (req, res) => {
  try {
    const pool = req.pool;
    const [users] = await pool.query(
      'SELECT id, email, first_name, last_name, phone, address, city, country, postal_code, role FROM users WHERE id = ?',
      [req.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Mettre à jour le profil
router.put('/profile', auth, async (req, res) => {
  try {
    const { first_name, last_name, phone, address, city, country, postal_code } = req.body;
    const pool = req.pool;

    await pool.query(
      'UPDATE users SET first_name = ?, last_name = ?, phone = ?, address = ?, city = ?, country = ?, postal_code = ? WHERE id = ?',
      [first_name, last_name, phone, address, city, country, postal_code, req.userId]
    );

    res.json({ message: 'Profil mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Changer le mot de passe
router.post('/change-password', auth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const pool = req.pool;

    // Récupérer l'utilisateur
    const [users] = await pool.query('SELECT password FROM users WHERE id = ?', [req.userId]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Vérifier l'ancien mot de passe
    const passwordMatch = await bcrypt.compare(oldPassword, users[0].password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Mot de passe actuel incorrect' });
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Mettre à jour
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.userId]);

    res.json({ message: 'Mot de passe changé avec succès' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;

