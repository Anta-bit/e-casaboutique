const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Récupérer le profil du client
router.get('/profile', auth, async (req, res) => {
  try {
    const pool = req.pool;
    const [users] = await pool.query(
      'SELECT id, email, first_name, last_name, phone, address, city, country, postal_code, role, created_at FROM users WHERE id = ?',
      [req.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'Profil non trouvé' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Mettre à jour le profil du client
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

// Récupérer les commandes du client
router.get('/orders', auth, async (req, res) => {
  try {
    const pool = req.pool;

    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [req.userId]
    );

    res.json(orders);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Récupérer les détails d'une commande
router.get('/order/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = req.pool;

    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [id, req.userId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }

    // Récupérer les articles de la commande
    const [items] = await pool.query(
      `SELECT oi.*, p.name, p.image_url
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [id]
    );

    res.json({ ...orders[0], items });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Récupérer les paiements du client
router.get('/payments', auth, async (req, res) => {
  try {
    const pool = req.pool;

    const [payments] = await pool.query(
      'SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC',
      [req.userId]
    );

    res.json(payments);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Récupérer les adresses enregistrées du client
router.get('/addresses', auth, async (req, res) => {
  try {
    const pool = req.pool;

    const [users] = await pool.query(
      'SELECT address, city, country, postal_code FROM users WHERE id = ?',
      [req.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'Adresses non trouvées' });
    }

    res.json([users[0]]);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Récupérer tous les clients (admin)
router.get('/', auth, async (req, res) => {
  try {
    const pool = req.pool;

    // Vérifier que l'utilisateur est admin
    const [users] = await pool.query('SELECT role FROM users WHERE id = ?', [req.userId]);
    if (users.length === 0 || users[0].role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const [clients] = await pool.query(
      'SELECT id, email, first_name, last_name, phone, city, country, role, created_at FROM users WHERE role = "client" ORDER BY created_at DESC'
    );

    res.json(clients);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Récupérer un client spécifique (admin)
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = req.pool;

    // Vérifier que l'utilisateur est admin
    const [users] = await pool.query('SELECT role FROM users WHERE id = ?', [req.userId]);
    if (users.length === 0 || users[0].role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const [clients] = await pool.query(
      'SELECT * FROM users WHERE id = ? AND role = "client"',
      [id]
    );

    if (clients.length === 0) {
      return res.status(404).json({ message: 'Client non trouvé' });
    }

    // Récupérer les commandes du client
    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [id]
    );

    res.json({ ...clients[0], orders });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Récupérer tous les utilisateurs (admin)
router.get('/admin/users', auth, async (req, res) => {
  try {
    const pool = req.pool;
    // Vérifier que l'utilisateur est admin
    const [currentUser] = await pool.query('SELECT role FROM users WHERE id = ?', [req.userId]);
    if (currentUser.length === 0 || currentUser[0].role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const [allUsers] = await pool.query(
      'SELECT id, email, first_name, last_name, phone, role, status, created_at FROM users WHERE role != "admin" ORDER BY role, created_at DESC'
    );
    res.json(allUsers);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Modifier le statut (actif/suspendu) d'un utilisateur (admin)
router.put('/admin/users/:id/status', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // active ou suspended
    const pool = req.pool;

    if (status !== 'active' && status !== 'suspended') {
      return res.status(400).json({ message: 'Statut invalide' });
    }

    // Vérifier que l'utilisateur est admin
    const [currentUser] = await pool.query('SELECT role FROM users WHERE id = ?', [req.userId]);
    if (currentUser.length === 0 || currentUser[0].role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    await pool.query('UPDATE users SET status = ? WHERE id = ?', [status, id]);
    res.json({ message: `Le compte utilisateur est désormais ${status === 'active' ? 'actif' : 'suspendu'}` });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Supprimer un utilisateur (admin)
router.delete('/admin/users/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = req.pool;

    // Vérifier que l'utilisateur est admin
    const [currentUser] = await pool.query('SELECT role FROM users WHERE id = ?', [req.userId]);
    if (currentUser.length === 0 || currentUser[0].role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'Compte utilisateur supprimé avec succès.' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Récupérer les inscriptions de fournisseurs en attente (admin)
router.get('/admin/suppliers/pending', auth, async (req, res) => {
  try {
    const pool = req.pool;
    // Vérifier que l'utilisateur est admin
    const [currentUser] = await pool.query('SELECT role FROM users WHERE id = ?', [req.userId]);
    if (currentUser.length === 0 || currentUser[0].role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const [pendingSuppliers] = await pool.query(
      `SELECT s.*, u.first_name, u.last_name, u.status as user_status
       FROM suppliers s
       JOIN users u ON s.user_id = u.id
       WHERE s.status = 'pending'
       ORDER BY s.created_at DESC`
    );
    res.json(pendingSuppliers);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Approuver/Rejeter une inscription de fournisseur (admin)
router.put('/admin/suppliers/:id/validate', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // approved ou rejected
    const pool = req.pool;

    if (status !== 'approved' && status !== 'rejected') {
      return res.status(400).json({ message: 'Statut de validation invalide' });
    }

    // Vérifier que l'utilisateur est admin
    const [currentUser] = await pool.query('SELECT role FROM users WHERE id = ?', [req.userId]);
    if (currentUser.length === 0 || currentUser[0].role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    // Mettre à jour le statut du fournisseur
    await pool.query('UPDATE suppliers SET status = ? WHERE id = ?', [status, id]);
    res.json({ message: `Le statut du fournisseur a été mis à jour : ${status}` });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;


