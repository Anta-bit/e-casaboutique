const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Récupérer le panier de l'utilisateur
router.get('/', auth, async (req, res) => {
  try {
    const pool = req.pool;

    const [cartItems] = await pool.query(
      `SELECT p.id AS id, c.quantity, p.name, p.price, p.image_url, p.stock, c.id AS cart_item_id
       FROM cart_items c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = ?
       ORDER BY c.added_at DESC`,
      [req.userId]
    );

    // Calculer le total
    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    res.json({ items: cartItems, total });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Ajouter un produit au panier
router.post('/add', auth, async (req, res) => {
  try {
    const { product_id, quantity = 1 } = req.body;
    const pool = req.pool;

    // Vérifier que le produit existe et qu'il y a du stock
    const [products] = await pool.query('SELECT stock FROM products WHERE id = ?', [product_id]);
    if (products.length === 0) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    if (products[0].stock < quantity) {
      return res.status(400).json({ message: 'Stock insuffisant' });
    }

    // Vérifier si le produit est déjà dans le panier
    const [existingItem] = await pool.query(
      'SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?',
      [req.userId, product_id]
    );

    if (existingItem.length > 0) {
      // Mettre à jour la quantité
      await pool.query(
        'UPDATE cart_items SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?',
        [quantity, req.userId, product_id]
      );
    } else {
      // Ajouter un nouvel article
      await pool.query(
        'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)',
        [req.userId, product_id, quantity]
      );
    }

    res.json({ message: 'Produit ajouté au panier' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Mettre à jour la quantité d'un produit
router.put('/update/:product_id', auth, async (req, res) => {
  try {
    const { product_id } = req.params;
    const { quantity } = req.body;
    const pool = req.pool;

    if (quantity <= 0) {
      // Supprimer l'article si la quantité est 0 ou négative
      await pool.query('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?', [req.userId, product_id]);
      return res.json({ message: 'Produit supprimé du panier' });
    }

    // Vérifier que le produit existe et qu'il y a du stock
    const [products] = await pool.query('SELECT stock FROM products WHERE id = ?', [product_id]);
    if (products.length === 0) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    if (products[0].stock < quantity) {
      return res.status(400).json({ message: 'Stock insuffisant' });
    }

    // Mettre à jour la quantité
    await pool.query(
      'UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?',
      [quantity, req.userId, product_id]
    );

    res.json({ message: 'Quantité mise à jour' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Supprimer un produit du panier
router.delete('/remove/:product_id', auth, async (req, res) => {
  try {
    const { product_id } = req.params;
    const pool = req.pool;

    await pool.query('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?', [req.userId, product_id]);

    res.json({ message: 'Produit supprimé du panier' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Vider le panier
router.delete('/clear', auth, async (req, res) => {
  try {
    const pool = req.pool;

    await pool.query('DELETE FROM cart_items WHERE user_id = ?', [req.userId]);

    res.json({ message: 'Panier vidé' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;

