const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Récupérer toutes les catégories
router.get('/', async (req, res) => {
  try {
    const pool = req.pool;
    const [categories] = await pool.query('SELECT * FROM categories WHERE parent_id IS NULL ORDER BY name');
    res.json(categories);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Récupérer une catégorie avec ses sous-catégories
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = req.pool;

    const [categories] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
    if (categories.length === 0) {
      return res.status(404).json({ message: 'Catégorie non trouvée' });
    }

    const [subcategories] = await pool.query('SELECT * FROM categories WHERE parent_id = ?', [id]);

    res.json({ ...categories[0], subcategories });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Créer une catégorie (admin)
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, image_url, parent_id } = req.body;
    const pool = req.pool;

    // Vérifier que l'utilisateur est admin
    const [users] = await pool.query('SELECT role FROM users WHERE id = ?', [req.userId]);
    if (users.length === 0 || users[0].role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const [result] = await pool.query(
      'INSERT INTO categories (name, description, image_url, parent_id) VALUES (?, ?, ?, ?)',
      [name, description, image_url, parent_id || null]
    );

    res.status(201).json({ message: 'Catégorie créée', id: result.insertId });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Mettre à jour une catégorie (admin)
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, image_url } = req.body;
    const pool = req.pool;

    // Vérifier que l'utilisateur est admin
    const [users] = await pool.query('SELECT role FROM users WHERE id = ?', [req.userId]);
    if (users.length === 0 || users[0].role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    await pool.query(
      'UPDATE categories SET name = ?, description = ?, image_url = ? WHERE id = ?',
      [name, description, image_url, id]
    );

    res.json({ message: 'Catégorie mise à jour' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Supprimer une catégorie (admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = req.pool;

    // Vérifier que l'utilisateur est admin
    const [users] = await pool.query('SELECT role FROM users WHERE id = ?', [req.userId]);
    if (users.length === 0 || users[0].role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    // Vérifier qu'il n'y a pas de produits liés
    const [products] = await pool.query('SELECT id FROM products WHERE category_id = ?', [id]);
    if (products.length > 0) {
      return res.status(400).json({ message: 'Impossible de supprimer la catégorie, elle contient des produits' });
    }

    await pool.query('DELETE FROM categories WHERE id = ?', [id]);

    res.json({ message: 'Catégorie supprimée' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;

