const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Créer une commande
router.post('/', auth, async (req, res) => {
  try {
    const { shipping_address, shipping_city, shipping_country, shipping_postal_code, notes } = req.body;
    const pool = req.pool;

    // Récupérer les articles du panier
    const [cartItems] = await pool.query(
      `SELECT c.product_id, c.quantity, p.price, p.name
       FROM cart_items c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = ?`,
      [req.userId]
    );

    if (cartItems.length === 0) {
      return res.status(400).json({ message: 'Le panier est vide' });
    }

    // Calculer le total
    const total_amount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const order_number = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Créer la commande
    const [result] = await pool.query(
      `INSERT INTO orders (user_id, order_number, total_amount, status, shipping_address, shipping_city, shipping_country, shipping_postal_code, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.userId, order_number, total_amount, 'pending', shipping_address, shipping_city, shipping_country, shipping_postal_code, notes]
    );

    const orderId = result.insertId;

    // Ajouter les articles dans la commande
    for (const item of cartItems) {
      await pool.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, item.product_id, item.quantity, item.price, item.price * item.quantity]
      );

      // Mettre à jour le stock
      await pool.query(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    // Vider le panier
    await pool.query('DELETE FROM cart_items WHERE user_id = ?', [req.userId]);

    res.status(201).json({
      message: 'Commande créée avec succès',
      orderId,
      order_number,
      total_amount
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Récupérer les commandes de l'utilisateur
router.get('/', auth, async (req, res) => {
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
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = req.pool;

    // Récupérer la commande
    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [id, req.userId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }

    // Récupérer les articles
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

// Mettre à jour le statut d'une commande (admin)
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const pool = req.pool;

    // Vérifier que l'utilisateur est admin
    const [users] = await pool.query('SELECT role FROM users WHERE id = ?', [req.userId]);
    if (users.length === 0 || users[0].role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);

    res.json({ message: 'Statut de la commande mis à jour' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Récupérer toutes les commandes (admin)
router.get('/admin/all', auth, async (req, res) => {
  try {
    const pool = req.pool;

    // Vérifier que l'utilisateur est admin
    const [users] = await pool.query('SELECT role FROM users WHERE id = ?', [req.userId]);
    if (users.length === 0 || users[0].role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const [orders] = await pool.query(
      `SELECT o.*, u.email, u.first_name, u.last_name
       FROM orders o
       JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC`
    );

    res.json(orders);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Télécharger la facture (renvoie le fichier HTML de facture)
router.get('/:id/invoice', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = req.pool;
    const fs = require('fs');
    const path = require('path');

    // 1. Vérifier si l'utilisateur est propriétaire de la commande ou admin
    const [users] = await pool.query('SELECT role FROM users WHERE id = ?', [req.userId]);
    const isAdmin = users.length > 0 && users[0].role === 'admin';

    let orderQuery = 'SELECT * FROM orders WHERE id = ?';
    let orderParams = [id];
    if (!isAdmin) {
      orderQuery += ' AND user_id = ?';
      orderParams.push(req.userId);
    }

    const [orders] = await pool.query(orderQuery, orderParams);
    if (orders.length === 0) {
      return res.status(404).json({ message: 'Commande non trouvée ou accès non autorisé' });
    }

    // 2. Chercher la facture correspondante
    const [invoices] = await pool.query('SELECT invoice_number FROM invoices WHERE order_id = ?', [id]);
    if (invoices.length === 0) {
      return res.status(404).json({ message: 'Facture non encore générée pour cette commande' });
    }

    const invoiceNumber = invoices[0].invoice_number;
    const invoicePath = path.join(__dirname, '../invoices', `${invoiceNumber}.html`);

    if (!fs.existsSync(invoicePath)) {
      return res.status(404).json({ message: 'Fichier de facture introuvable sur le serveur' });
    }

    res.setHeader('Content-Type', 'text/html');
    res.sendFile(invoicePath);
  } catch (error) {
    console.error('Erreur lors de la récupération de la facture:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération de la facture' });
  }
});

module.exports = router;


