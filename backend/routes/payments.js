const express = require('express');
const axios = require('axios');
const router = express.Router();
const auth = require('../middleware/auth');

// Initier un paiement
router.post('/initiate', auth, async (req, res) => {
  try {
    const { order_id, payment_method } = req.body;
    const pool = req.pool;

    // Vérifier que la commande existe
    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ? AND user_id = ?', [order_id, req.userId]);
    if (orders.length === 0) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }

    const order = orders[0];
    const amount = order.total_amount;

    let response;

    // Selon la méthode de paiement
    switch (payment_method) {
      case 'paytech':
        response = await handlePayTech(order, amount);
        break;
      case 'wave':
        response = await handleWave(order, amount);
        break;
      case 'orange_money':
        response = await handleOrangeMoney(order, amount);
        break;
      default:
        return res.status(400).json({ message: 'Méthode de paiement non supportée' });
    }

    // Créer un enregistrement de paiement
    const [result] = await pool.query(
      'INSERT INTO payments (order_id, user_id, amount, payment_method, payment_status, payment_reference) VALUES (?, ?, ?, ?, ?, ?)',
      [order_id, req.userId, amount, payment_method, 'pending', response.payment_reference]
    );

    res.json({
      message: 'Paiement initié',
      payment_id: result.insertId,
      ...response
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur lors de l\'initiation du paiement' });
  }
});

// Vérifier le statut de paiement PayTech
router.post('/verify-paytech', auth, async (req, res) => {
  try {
    const { payment_reference } = req.body;
    const pool = req.pool;

    // Vérifier le paiement avec PayTech
    const paytechResponse = await axios.post('https://api.paytech.sn/api/v1/transactions/verify', {
      merchant_id: process.env.PAYTECH_MERCHANT_ID,
      api_key: process.env.PAYTECH_API_KEY,
      payment_ref: payment_reference
    });

    if (paytechResponse.data.status === 'completed' || paytechResponse.data.status === 'success') {
      // Mettre à jour le paiement
      const [payments] = await pool.query(
        'SELECT * FROM payments WHERE payment_reference = ?',
        [payment_reference]
      );

      if (payments.length > 0) {
        await pool.query(
          'UPDATE payments SET payment_status = ?, transaction_id = ?, paid_at = NOW() WHERE id = ?',
          ['completed', paytechResponse.data.transaction_id, payments[0].id]
        );

        // Mettre à jour le statut de la commande
        await pool.query(
          'UPDATE orders SET status = ? WHERE id = ?',
          ['confirmed', payments[0].order_id]
        );

        // Générer et envoyer la facture
        await generateAndSendInvoice(pool, payments[0].order_id);

        res.json({ message: 'Paiement confirmé' });
      }
    } else {
      res.status(400).json({ message: 'Paiement non confirmé' });
    }
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur lors de la vérification du paiement' });
  }
});

// Callback PayTech
router.post('/paytech-callback', async (req, res) => {
  try {
    const { payment_ref, status, transaction_id } = req.body;
    const pool = req.pool;

    if (status === 'completed' || status === 'success') {
      const [payments] = await pool.query(
        'SELECT order_id FROM payments WHERE payment_reference = ?',
        [payment_ref]
      );

      if (payments.length > 0) {
        await pool.query(
          'UPDATE payments SET payment_status = ?, transaction_id = ?, paid_at = NOW() WHERE payment_reference = ?',
          ['completed', transaction_id, payment_ref]
        );

        await pool.query(
          'UPDATE orders SET status = ? WHERE id = ?',
          ['confirmed', payments[0].order_id]
        );

        // Générer et envoyer la facture
        await generateAndSendInvoice(pool, payments[0].order_id);
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Fonctions auxiliaires

async function handlePayTech(order, amount) {
  try {
    const payload = {
      merchant_id: process.env.PAYTECH_MERCHANT_ID,
      api_key: process.env.PAYTECH_API_KEY,
      amount: Math.round(amount * 100),
      currency: 'XOF',
      order_id: order.order_number,
      merchant_name: 'Casa Boutique',
      return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/checkout/success`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/checkout/cancel`,
      webhook_url: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payments/paytech-callback`
    };

    const paytechResponse = await axios.post('https://api.paytech.sn/api/v1/transactions/create', payload);

    return {
      payment_url: paytechResponse.data.payment_url,
      payment_reference: paytechResponse.data.payment_ref
    };
  } catch (error) {
    console.error('Erreur PayTech:', error);
    throw error;
  }
}

async function handleWave(order, amount) {
  try {
    const payload = {
      api_key: process.env.WAVE_API_KEY,
      amount: amount,
      currency: 'XOF',
      merchant_name: 'Casa Boutique',
      order_id: order.order_number
    };

    const waveResponse = await axios.post('https://api.wave.sn/v1/transactions', payload);

    return {
      payment_url: waveResponse.data.payment_url,
      payment_reference: waveResponse.data.transaction_id
    };
  } catch (error) {
    console.error('Erreur Wave:', error);
    throw error;
  }
}

async function handleOrangeMoney(order, amount) {
  try {
    const payload = {
      api_key: process.env.ORANGE_MONEY_API_KEY,
      amount: amount,
      currency: 'XOF',
      merchant_name: 'Casa Boutique',
      order_id: order.order_number
    };

    const orangeResponse = await axios.post('https://api.orangemoney.sn/v1/payment', payload);

    return {
      payment_url: orangeResponse.data.authorization_url,
      payment_reference: orangeResponse.data.reference
    };
  } catch (error) {
    console.error('Erreur Orange Money:', error);
    throw error;
  }
}

// Récupérer les paiements de l'utilisateur
router.get('/', auth, async (req, res) => {
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

// Récupérer les paiements d'une commande
router.get('/order/:order_id', auth, async (req, res) => {
  try {
    const { order_id } = req.params;
    const pool = req.pool;

    const [payments] = await pool.query(
      'SELECT * FROM payments WHERE order_id = ? AND user_id = ?',
      [order_id, req.userId]
    );

    res.json(payments);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Récupérer les méthodes de paiement
router.get('/methods', (req, res) => {
  res.json([
    { id: 1, name: 'PayTech', icon: 'card' },
    { id: 2, name: 'Wave', icon: 'wallet' },
    { id: 3, name: 'Orange Money', icon: 'phone' }
  ]);
});

const fs = require('fs');
const path = require('path');

async function generateAndSendInvoice(pool, order_id) {
  try {
    // 1. Vérifier si une facture existe déjà pour cette commande
    const [existing] = await pool.query('SELECT id FROM invoices WHERE order_id = ?', [order_id]);
    if (existing.length > 0) {
      console.log(`Facture déjà existante pour la commande ${order_id}`);
      return;
    }

    // 2. Récupérer les détails de la commande et du client
    const [orders] = await pool.query(
      `SELECT o.*, u.email, u.first_name, u.last_name, u.phone 
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.id = ?`,
      [order_id]
    );

    if (orders.length === 0) {
      console.error(`Commande ${order_id} non trouvée pour la facturation`);
      return;
    }

    const order = orders[0];

    // 3. Récupérer les articles de la commande
    const [items] = await pool.query(
      `SELECT oi.*, p.name 
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [order_id]
    );

    // 4. Générer le numéro de facture
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const invoice_number = `INV-${dateStr}-${randNum}`;

    // 5. Insérer la facture en BDD
    const [result] = await pool.query(
      `INSERT INTO invoices (invoice_number, order_id, user_id, amount, tax, status, sent_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [invoice_number, order_id, order.user_id, order.total_amount, 0.00, 'paid', 'email']
    );

    console.log(`Facture ${invoice_number} insérée en base de données avec ID ${result.insertId}`);

    // 6. Construire la facture HTML
    let itemsRows = '';
    for (const item of items) {
      itemsRows += `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">${item.unit_price} XOF</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">${item.total_price} XOF</td>
        </tr>
      `;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Facture ${invoice_number}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #333; margin: 0; padding: 20px; }
          .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, 0.15); }
          .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #e65100; }
          .invoice-details { text-align: right; }
          .client-details { margin-bottom: 30px; }
          .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .total { text-align: right; font-size: 18px; font-weight: bold; color: #e65100; }
        </style>
      </head>
      <body>
        <div class="invoice-box">
          <div class="header">
            <div class="logo">🏠 CASA BOUTIQUE</div>
            <div class="invoice-details">
              <strong>Facture #:</strong> ${invoice_number}<br>
              <strong>Date:</strong> ${new Date().toLocaleDateString('fr-FR')}<br>
              <strong>Commande #:</strong> ${order.order_number}
            </div>
          </div>
          <div class="client-details">
            <strong>Facturé à:</strong><br>
            ${order.first_name || ''} ${order.last_name || ''}<br>
            Email: ${order.email}<br>
            Tél: ${order.phone || 'Non renseigné'}<br>
            Adresse: ${order.shipping_address || 'Non spécifiée'}, ${order.shipping_city || ''}, ${order.shipping_country || ''}
          </div>
          <table class="table">
            <thead>
              <tr style="background: #f8f9fa;">
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Produit</th>
                <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Quantité</th>
                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Prix unitaire</th>
                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>
          <div class="total">
            Total Payé: ${order.total_amount} XOF
          </div>
          <div style="margin-top: 50px; text-align: center; font-size: 12px; color: #777;">
            Merci pour votre achat chez Casa Boutique !
          </div>
        </div>
      </body>
      </html>
    `;

    // 7. Enregistrer la facture localement dans un dossier "invoices"
    const invoicesDir = path.join(__dirname, '../invoices');
    if (!fs.existsSync(invoicesDir)) {
      fs.mkdirSync(invoicesDir, { recursive: true });
    }
    const invoicePath = path.join(invoicesDir, `${invoice_number}.html`);
    fs.writeFileSync(invoicePath, htmlContent);
    console.log(`Facture HTML sauvegardée localement: ${invoicePath}`);

    // 8. Tenter l'envoi de l'e-mail
    let nodemailer;
    try {
      nodemailer = require('nodemailer');
    } catch (e) {
      console.log("Nodemailer n'est pas disponible");
    }

    if (nodemailer && process.env.GMAIL_USER && process.env.GMAIL_PASS) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASS
        }
      });

      const mailOptions = {
        from: `"Casa Boutique" <${process.env.GMAIL_USER}>`,
        to: order.email,
        subject: `Votre facture Casa Boutique - ${invoice_number}`,
        html: htmlContent
      };

      await transporter.sendMail(mailOptions);
      console.log(`Facture e-mail envoyée avec succès à ${order.email}`);
      await pool.query('UPDATE invoices SET status = ? WHERE id = ?', ['sent', result.insertId]);
    } else {
      console.log(`[Email Simulation] Envoi d'email à ${order.email} de la facture ${invoice_number}`);
    }

    // 9. Simuler ou envoyer par WhatsApp
    if (process.env.WHATSAPP_API_KEY && order.phone) {
      console.log(`[WhatsApp API Call] Envoi de la facture ${invoice_number} au numéro ${order.phone}`);
    } else if (order.phone) {
      console.log(`[WhatsApp Simulation] Notification WhatsApp envoyée au numéro ${order.phone} : "Votre facture ${invoice_number} de ${order.total_amount} XOF a été générée."`);
    }

  } catch (error) {
    console.error('Erreur lors de la génération/envoi de la facture:', error);
  }
}

module.exports = router;

