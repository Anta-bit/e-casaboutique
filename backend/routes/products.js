const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Récupérer tous les produits avec filtres
router.get('/', async (req, res) => {
  try {
    const { category_id, search, sort, limit = 20, offset = 0, supplier_id } = req.query;
    const pool = req.pool;
    let query = `
      SELECT p.*, c.name AS category_name, s.name AS supplier_name 
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (category_id) {
      query += ' AND p.category_id = ?';
      params.push(category_id);
    }

    if (supplier_id) {
      query += ' AND p.supplier_id = ?';
      params.push(supplier_id);
    }

    if (search) {
      query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    // Tri
    switch (sort) {
      case 'price_asc':
        query += ' ORDER BY p.price ASC';
        break;
      case 'price_desc':
        query += ' ORDER BY p.price DESC';
        break;
      case 'newest':
        query += ' ORDER BY p.created_at DESC';
        break;
      case 'popular':
        query += ' ORDER BY p.views DESC';
        break;
      case 'rating':
        query += ' ORDER BY p.rating DESC';
        break;
      default:
        query += ' ORDER BY p.created_at DESC';
    }

    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [products] = await pool.query(query, params);

    res.json(products);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Récupérer un produit spécifique
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = req.pool;

    const [products] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    if (products.length === 0) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    // Récupérer les avis
    const [reviews] = await pool.query('SELECT * FROM reviews WHERE product_id = ?', [id]);

    res.json({ ...products[0], reviews });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Créer un produit (admin/supplier)
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, price, original_price, category_id, stock, image_url, images, discount_percent } = req.body;
    const pool = req.pool;

    // Vérifier les permissions
    const [users] = await pool.query('SELECT role FROM users WHERE id = ?', [req.userId]);
    if (users.length === 0 || (users[0].role !== 'admin' && users[0].role !== 'supplier')) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    let supplier_id = req.body.supplier_id || null;
    if (users[0].role === 'supplier') {
      const [supplierProfile] = await pool.query('SELECT id FROM suppliers WHERE user_id = ?', [req.userId]);
      if (supplierProfile.length > 0) {
        supplier_id = supplierProfile[0].id;
      } else {
        return res.status(403).json({ message: 'Profil fournisseur introuvable ou non approuvé.' });
      }
    }

    const [result] = await pool.query(
      'INSERT INTO products (name, description, price, original_price, category_id, supplier_id, stock, image_url, images, discount_percent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, description, price, original_price || null, category_id, supplier_id, stock, image_url, JSON.stringify(images || []), discount_percent || 0]
    );

    res.status(201).json({
      message: 'Produit créé avec succès',
      id: result.insertId
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Mettre à jour un produit
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, original_price, category_id, stock, image_url, images, discount_percent } = req.body;
    const pool = req.pool;

    // Vérifier les permissions
    const [users] = await pool.query('SELECT role FROM users WHERE id = ?', [req.userId]);
    if (users.length === 0 || (users[0].role !== 'admin' && users[0].role !== 'supplier')) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const [products] = await pool.query('SELECT supplier_id FROM products WHERE id = ?', [id]);
    if (products.length === 0) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    // Vérifier que le supplier ne peut modifier que ses propres produits
    if (users[0].role === 'supplier') {
      const [supplierProfile] = await pool.query('SELECT id FROM suppliers WHERE user_id = ?', [req.userId]);
      const supplierId = supplierProfile.length > 0 ? supplierProfile[0].id : null;
      if (products[0].supplier_id !== supplierId) {
        return res.status(403).json({ message: 'Vous ne pouvez modifier que vos propres produits' });
      }
    }

    await pool.query(
      'UPDATE products SET name = ?, description = ?, price = ?, original_price = ?, category_id = ?, stock = ?, image_url = ?, images = ?, discount_percent = ? WHERE id = ?',
      [name, description, price, original_price || null, category_id, stock, image_url, JSON.stringify(images || []), discount_percent || 0, id]
    );

    res.json({ message: 'Produit mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Supprimer un produit
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = req.pool;

    // Vérifier les permissions
    const [users] = await pool.query('SELECT role FROM users WHERE id = ?', [req.userId]);
    if (users.length === 0 || (users[0].role !== 'admin' && users[0].role !== 'supplier')) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const [products] = await pool.query('SELECT supplier_id FROM products WHERE id = ?', [id]);
    if (products.length === 0) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    if (users[0].role === 'supplier') {
      const [supplierProfile] = await pool.query('SELECT id FROM suppliers WHERE user_id = ?', [req.userId]);
      const supplierId = supplierProfile.length > 0 ? supplierProfile[0].id : null;
      if (products[0].supplier_id !== supplierId) {
        return res.status(403).json({ message: 'Vous ne pouvez supprimer que vos propres produits' });
      }
    }

    await pool.query('DELETE FROM products WHERE id = ?', [id]);

    res.json({ message: 'Produit supprimé avec succès' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Ajouter un avis
router.post('/:id/reviews', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const pool = req.pool;

    // Vérifier que le produit existe
    const [products] = await pool.query('SELECT id FROM products WHERE id = ?', [id]);
    if (products.length === 0) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    // Ajouter l'avis
    await pool.query(
      'INSERT INTO reviews (product_id, user_id, rating, comment) VALUES (?, ?, ?, ?)',
      [id, req.userId, rating, comment]
    );

    // Mettre à jour la note moyenne du produit
    const [reviews] = await pool.query('SELECT AVG(rating) as avg_rating FROM reviews WHERE product_id = ?', [id]);
    const avgRating = reviews[0].avg_rating || 0;
    await pool.query('UPDATE products SET rating = ? WHERE id = ?', [avgRating, id]);

    res.status(201).json({ message: 'Avis ajouté avec succès' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;

