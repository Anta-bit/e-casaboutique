const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Récupérer les statistiques du tableau de bord
router.get('/dashboard', auth, async (req, res) => {
  try {
    const pool = req.pool;

    // Vérifier que l'utilisateur est admin
    const [users] = await pool.query('SELECT role FROM users WHERE id = ?', [req.userId]);
    if (users.length === 0 || users[0].role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    // Nombre total de clients
    const [clientsCount] = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = "client"');

    // Nombre total de produits
    const [productsCount] = await pool.query('SELECT COUNT(*) as count FROM products');

    // Nombre total de catégories
    const [categoriesCount] = await pool.query('SELECT COUNT(*) as count FROM categories WHERE parent_id IS NULL');

    // Nombre total de commandes
    const [ordersCount] = await pool.query('SELECT COUNT(*) as count FROM orders');

    // Montant total des ventes
    const [totalSales] = await pool.query('SELECT SUM(total_amount) as total FROM orders');

    // Nombre de commandes par statut
    const [ordersByStatus] = await pool.query(
      'SELECT status, COUNT(*) as count FROM orders GROUP BY status'
    );

    // Paiements complétés
    const [completedPayments] = await pool.query(
      'SELECT COUNT(*) as count FROM payments WHERE payment_status = "completed"'
    );

    // Paiements en attente
    const [pendingPayments] = await pool.query(
      'SELECT COUNT(*) as count FROM payments WHERE payment_status = "pending"'
    );

    res.json({
      clients: clientsCount[0].count,
      products: productsCount[0].count,
      categories: categoriesCount[0].count,
      orders: ordersCount[0].count,
      totalSales: totalSales[0].total || 0,
      ordersByStatus,
      completedPayments: completedPayments[0].count,
      pendingPayments: pendingPayments[0].count
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Récupérer les ventes par jour (derniers 30 jours)
router.get('/sales-by-day', auth, async (req, res) => {
  try {
    const pool = req.pool;

    // Vérifier que l'utilisateur est admin
    const [users] = await pool.query('SELECT role FROM users WHERE id = ?', [req.userId]);
    if (users.length === 0 || users[0].role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const [sales] = await pool.query(
      `SELECT DATE(created_at) as date, SUM(total_amount) as total, COUNT(*) as count
       FROM orders
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY DATE(created_at)
       ORDER BY date ASC`
    );

    res.json(sales);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Récupérer les produits les plus vendus
router.get('/top-products', auth, async (req, res) => {
  try {
    const pool = req.pool;

    // Vérifier que l'utilisateur est admin
    const [users] = await pool.query('SELECT role FROM users WHERE id = ?', [req.userId]);
    if (users.length === 0 || users[0].role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const [topProducts] = await pool.query(
      `SELECT p.id, p.name, p.price, SUM(oi.quantity) as total_sold, SUM(oi.total_price) as revenue
       FROM products p
       JOIN order_items oi ON p.id = oi.product_id
       GROUP BY p.id
       ORDER BY total_sold DESC
       LIMIT 10`
    );

    res.json(topProducts);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Récupérer les revenus par catégorie
router.get('/revenue-by-category', auth, async (req, res) => {
  try {
    const pool = req.pool;

    // Vérifier que l'utilisateur est admin
    const [users] = await pool.query('SELECT role FROM users WHERE id = ?', [req.userId]);
    if (users.length === 0 || users[0].role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const [revenue] = await pool.query(
      `SELECT c.name, SUM(oi.total_price) as revenue, COUNT(DISTINCT oi.order_id) as orders
       FROM categories c
       JOIN products p ON c.id = p.category_id
       JOIN order_items oi ON p.id = oi.product_id
       GROUP BY c.id
       ORDER BY revenue DESC`
    );

    res.json(revenue);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Récupérer les meilleurs clients
router.get('/top-customers', auth, async (req, res) => {
  try {
    const pool = req.pool;

    // Vérifier que l'utilisateur est admin
    const [users] = await pool.query('SELECT role FROM users WHERE id = ?', [req.userId]);
    if (users.length === 0 || users[0].role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const [topCustomers] = await pool.query(
      `SELECT u.id, u.first_name, u.last_name, u.email, COUNT(o.id) as orders, SUM(o.total_amount) as total_spent
       FROM users u
       JOIN orders o ON u.id = o.user_id
       GROUP BY u.id
       ORDER BY total_spent DESC
       LIMIT 10`
    );

    res.json(topCustomers);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;

