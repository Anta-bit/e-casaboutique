# 💳 Guide d'Intégration des Paiements - Casa Boutique

## 🏦 PayTech SN

### Configuration

1. **Créer un compte PayTech:**
   - Visiter: https://www.paytech.sn
   - Créer un compte marchand
   - Obtenir votre Merchant ID et API Key

2. **Configurer dans `.env`:**
```env
PAYTECH_MERCHANT_ID=your_merchant_id
PAYTECH_API_KEY=your_api_key
```

3. **Flux de Paiement:**

```js
// Frontend
const initiatePaytech = async (orderId) => {
  try {
    const response = await paymentService.initiatePayment(orderId, 'paytech');
    // Rediriger vers payment_url
    window.location.href = response.payment_url;
  } catch (error) {
    console.error('Erreur PayTech:', error);
  }
};

// Backend reçoit la vérification
// PayTech envoie un callback à /api/payments/paytech-callback
// La commande est automatiquement mise à jour
```

4. **Endpoints PayTech:**
   - URL Production: `https://api.paytech.sn/api/v1/transactions/create`
   - URL Vérification: `https://api.paytech.sn/api/v1/transactions/verify`

### Test

```bash
# URL de test (à vérifier avec PayTech)
https://api-staging.paytech.sn/...
```

---

## 📱 Wave SN

### Configuration

1. **Créer une App Wave:**
   - Visiter: https://app.wave.sn
   - Créer un compte business
   - Générer une clé API

2. **Configurer dans `.env`:**
```env
WAVE_API_KEY=your_wave_api_key
```

3. **Flux de Paiement:**

```js
// Similaire à PayTech
const initiateWave = async (orderId) => {
  try {
    const response = await paymentService.initiatePayment(orderId, 'wave');
    window.location.href = response.payment_url;
  } catch (error) {
    console.error('Erreur Wave:', error);
  }
};
```

4. **Endpoints Wave:**
   - URL API: `https://api.wave.sn/v1/transactions`

---

## 🍊 Orange Money SN

### Configuration

1. **Créer une Intégration Orange:**
   - Contacter Orange Money directement
   - Obtenir les identifiants d'accès

2. **Configurer dans `.env`:**
```env
ORANGE_MONEY_API_KEY=your_orange_key
```

3. **Flux de Paiement:**

```js
// Similaire aux autres
const initiateOrange = async (orderId) => {
  try {
    const response = await paymentService.initiatePayment(orderId, 'orange_money');
    window.location.href = response.payment_url;
  } catch (error) {
    console.error('Erreur Orange:', error);
  }
};
```

---

## 🛒 Intégration Frontend

### Exemple CheckoutPage.js

```jsx
import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Card } from 'react-bootstrap';
import { paymentService } from '../services/api';
import { useCartStore } from '../store';

const CheckoutPage = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    shipping_address: '',
    shipping_city: '',
    shipping_country: 'Senegal',
    shipping_postal_code: '',
    payment_method: 'paytech'
  });

  const cartTotal = useCartStore(state => state.getTotal());
  const cartItems = useCartStore(state => state.items);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Créer la commande
      const orderResponse = await orderService.create(formData);
      const orderId = orderResponse.data.orderId;

      // 2. Initier le paiement
      const paymentResponse = await paymentService.initiatePayment(
        orderId,
        formData.payment_method
      );

      // 3. Rediriger vers le paiement
      window.location.href = paymentResponse.payment_url;

    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors du paiement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <Row>
        {/* Formulaire */}
        <Col md={6}>
          <h3>Adresse de Livraison</h3>
          <Form onSubmit={handlePayment}>
            <Form.Group className="mb-3">
              <Form.Label>Adresse</Form.Label>
              <Form.Control
                type="text"
                name="shipping_address"
                value={formData.shipping_address}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Ville</Form.Label>
              <Form.Control
                type="text"
                name="shipping_city"
                value={formData.shipping_city}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Code Postal</Form.Label>
              <Form.Control
                type="text"
                name="shipping_postal_code"
                value={formData.shipping_postal_code}
                onChange={handleChange}
              />
            </Form.Group>

            <h3 className="mt-5">Mode de Paiement</h3>
            <Form.Group className="mb-3">
              <Form.Check
                type="radio"
                name="payment_method"
                value="paytech"
                label="PayTech"
                checked={formData.payment_method === 'paytech'}
                onChange={handleChange}
              />
              <Form.Check
                type="radio"
                name="payment_method"
                value="wave"
                label="Wave"
                checked={formData.payment_method === 'wave'}
                onChange={handleChange}
              />
              <Form.Check
                type="radio"
                name="payment_method"
                value="orange_money"
                label="Orange Money"
                checked={formData.payment_method === 'orange_money'}
                onChange={handleChange}
              />
            </Form.Group>

            <Button
              variant="danger"
              size="lg"
              className="w-100"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Paiement en cours...' : 'Procéder au Paiement'}
            </Button>
          </Form>
        </Col>

        {/* Résumé */}
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5>Résumé de la Commande</h5>
            </Card.Header>
            <Card.Body>
              {cartItems.map(item => (
                <div key={item.id} className="d-flex justify-content-between mb-2">
                  <span>{item.name} x {item.quantity}</span>
                  <span>{item.price * item.quantity} XOF</span>
                </div>
              ))}
              <hr />
              <div className="d-flex justify-content-between">
                <strong>Total:</strong>
                <strong className="text-danger">{cartTotal} XOF</strong>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CheckoutPage;
```

---

## ✅ Capture de Paiement

### Callback PayTech

PayTech envoie un callback à votre webhook:

```
POST /api/payments/paytech-callback
Content-Type: application/json

{
  "payment_ref": "PAY_12345",
  "status": "completed",
  "transaction_id": "TXN_67890",
  "amount": 50000
}
```

Le backend:
1. Vérifie la signature (optionnel mais recommandé)
2. Met à jour le statut du paiement à "completed"
3. Met à jour le statut de la commande à "confirmed"

### Vérification Manuelle

```js
// Si le client ne reçoit pas le callback
const verifiyPayment = async (paymentReference) => {
  try {
    const response = await paymentService.verifyPaytech(paymentReference);
    console.log('Paiement confirmé:', response);
  } catch (error) {
    console.error('Paiement non confirmé');
  }
};
```

---

## 🔐 Points de Sécurité

1. **Jamais de sensibilité au frontend:**
   - Les clés API restent au backend
   - Le frontend appelle un endpoint backend

2. **Validation des montants:**
   ```js
   // Backend: Vérifier que le montant payé = montant commandé
   if (paymentAmount !== orderAmount) {
     throw new Error('Montant invalide');
   }
   ```

3. **Signatures de validation:**
   - Vérifier les signatures PayTech si possible
   - Utiliser HTTPS en production

4. **Timeout de paiement:**
   - Une commande non payée après 24h est annulée
   - (À implémenter avec cron job)

---

## 🧪 Environnement de Test

### Mock Paiements en Développement

```js
// Pour tester sans vraies transactions:

if (process.env.NODE_ENV === 'development') {
  // Simpler le paiement

  router.post('/payments/initiate-test', auth, (req, res) => {
    res.json({
      payment_url: 'http://localhost:3000/checkout/success',
      payment_reference: 'TEST_' + Date.now()
    });
  });
}
```

---

## 📞 Support Paiements

### PayTech
- Site: https://www.paytech.sn
- Email: support@paytech.sn
- Phone: +221 33 820 82 08

### Wave
- Site: https://app.wave.sn
- Support: support@wave.sn

### Orange Money
- Site: https://orangemoney.sn
- Support: Contacter Orange directement

---

## 📋 Checklist Configuration

- [ ] Créer compte PayTech
- [ ] Créer compte Wave
- [ ] Créer intégration Orange Money
- [ ] Ajouter clés API au .env
- [ ] Tester les paiements en environnement de test
- [ ] Valider les callbacks
- [ ] Configurer les URLs de retour
- [ ] Mettre en place la gestion des refunds
- [ ] Tester la synchronisation des paiements

---

C'est fait! Votre système de paiement est prêt! 🎉

