const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Récupérer le profil du fournisseur connecté
router.get('/me/profile', auth, async (req, res) => {
  try {
    const pool = req.pool;
    const [suppliers] = await pool.query('SELECT * FROM suppliers WHERE user_id = ?', [req.userId]);
    if (suppliers.length === 0) {
      return res.status(404).json({ message: 'Profil fournisseur non trouvé' });
    }
    res.json(suppliers[0]);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Mettre à jour le profil du fournisseur connecté
router.put('/me/profile', auth, async (req, res) => {
  try {
    const { name, phone, address, city, country, company_name, tax_number } = req.body;
    const pool = req.pool;
    
    const [suppliers] = await pool.query('SELECT id FROM suppliers WHERE user_id = ?', [req.userId]);
    if (suppliers.length === 0) {
      return res.status(404).json({ message: 'Profil fournisseur non trouvé' });
    }

    await pool.query(
      'UPDATE suppliers SET name = ?, phone = ?, address = ?, city = ?, country = ?, company_name = ?, tax_number = ? WHERE user_id = ?',
      [name, phone, address, city, country, company_name, tax_number, req.userId]
    );

    res.json({ message: 'Profil professionnel mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Récupérer les statistiques du fournisseur connecté
router.get('/me/stats', auth, async (req, res) => {
  try {
    const pool = req.pool;
    const [suppliers] = await pool.query('SELECT id FROM suppliers WHERE user_id = ?', [req.userId]);
    if (suppliers.length === 0) {
      return res.status(404).json({ message: 'Profil fournisseur non trouvé' });
    }
    const supplierId = suppliers[0].id;

    // Nombre de produits
    const [[{ productsCount }]] = await pool.query('SELECT COUNT(*) as productsCount FROM products WHERE supplier_id = ?', [supplierId]);
    // Quantité totale en stock
    const [[{ totalStock }]] = await pool.query('SELECT SUM(stock) as totalStock FROM products WHERE supplier_id = ?', [supplierId]);
    
    // Ventes totales
    const [sales] = await pool.query(
      `SELECT SUM(oi.total_price) as totalSales, COUNT(DISTINCT oi.order_id) as ordersCount
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       JOIN orders o ON oi.order_id = o.id
       WHERE p.supplier_id = ? AND o.status != 'cancelled'`,
      [supplierId]
    );

    // Évolution des ventes (30 derniers jours)
    const [salesByDay] = await pool.query(
      `SELECT DATE(o.created_at) as date, SUM(oi.total_price) as total
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       JOIN orders o ON oi.order_id = o.id
       WHERE p.supplier_id = ? AND o.status != 'cancelled' AND o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY DATE(o.created_at)
       ORDER BY DATE(o.created_at) ASC`,
      [supplierId]
    );

    // Produits les plus vendus
    const [topProducts] = await pool.query(
      `SELECT p.name, SUM(oi.quantity) as total_sold, SUM(oi.total_price) as revenue
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       JOIN orders o ON oi.order_id = o.id
       WHERE p.supplier_id = ? AND o.status != 'cancelled'
       GROUP BY p.id
       ORDER BY total_sold DESC LIMIT 5`,
      [supplierId]
    );

    res.json({
      products: productsCount || 0,
      stock: totalStock || 0,
      totalSales: sales[0].totalSales || 0,
      orders: sales[0].ordersCount || 0,
      salesByDay,
      topProducts
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Récupérer les commandes du fournisseur connecté
router.get('/me/orders', auth, async (req, res) => {
  try {
    const pool = req.pool;
    const [suppliers] = await pool.query('SELECT id FROM suppliers WHERE user_id = ?', [req.userId]);
    if (suppliers.length === 0) {
      return res.status(404).json({ message: 'Profil fournisseur non trouvé' });
    }
    const supplierId = suppliers[0].id;

    // Récupérer toutes les commandes qui contiennent au moins un produit du fournisseur
    const [orders] = await pool.query(
      `SELECT DISTINCT o.*, u.first_name, u.last_name, u.email, u.phone
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       JOIN products p ON oi.product_id = p.id
       JOIN users u ON o.user_id = u.id
       WHERE p.supplier_id = ?
       ORDER BY o.created_at DESC`,
      [supplierId]
    );

    // Pour chaque commande, récupérer uniquement les articles du fournisseur
    for (let order of orders) {
      const [items] = await pool.query(
        `SELECT oi.*, p.name, p.image_url
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ? AND p.supplier_id = ?`,
        [order.id, supplierId]
      );
      order.items = items;
    }

    res.json(orders);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Récupérer tous les fournisseurs
router.get('/', async (req, res) => {
  try {
    const pool = req.pool;
    const [suppliers] = await pool.query('SELECT * FROM suppliers ORDER BY name');
    res.json(suppliers);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Récupérer un fournisseur spécifique
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = req.pool;

    const [suppliers] = await pool.query('SELECT * FROM suppliers WHERE id = ?', [id]);
    if (suppliers.length === 0) {
      return res.status(404).json({ message: 'Fournisseur non trouvé' });
    }

    // Récupérer les produits du fournisseur
    const [products] = await pool.query('SELECT * FROM products WHERE supplier_id = ?', [id]);

    res.json({ ...suppliers[0], products });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Créer un fournisseur (admin)
router.post('/', auth, async (req, res) => {
  try {
    const { name, email, phone, address, city, country, company_name, tax_number } = req.body;
    const pool = req.pool;

    // Vérifier que l'utilisateur est admin
    const [users] = await pool.query('SELECT role FROM users WHERE id = ?', [req.userId]);
    if (users.length === 0 || users[0].role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const [result] = await pool.query(
      'INSERT INTO suppliers (name, email, phone, address, city, country, company_name, tax_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, email, phone, address, city, country, company_name, tax_number]
    );

    res.status(201).json({ message: 'Fournisseur créé', id: result.insertId });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Mettre à jour un fournisseur (admin)
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, city, country, company_name, tax_number } = req.body;
    const pool = req.pool;

    // Vérifier que l'utilisateur est admin
    const [users] = await pool.query('SELECT role FROM users WHERE id = ?', [req.userId]);
    if (users.length === 0 || users[0].role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    await pool.query(
      'UPDATE suppliers SET name = ?, email = ?, phone = ?, address = ?, city = ?, country = ?, company_name = ?, tax_number = ? WHERE id = ?',
      [name, email, phone, address, city, country, company_name, tax_number, id]
    );

    res.json({ message: 'Fournisseur mis à jour' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Supprimer un fournisseur (admin)
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
    const [products] = await pool.query('SELECT id FROM products WHERE supplier_id = ?', [id]);
    if (products.length > 0) {
      return res.status(400).json({ message: 'Impossible de supprimer le fournisseur, il a des produits actifs' });
    }

    await pool.query('DELETE FROM suppliers WHERE id = ?', [id]);

    res.json({ message: 'Fournisseur supprimé' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;

