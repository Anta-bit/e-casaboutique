# 🎨 Guide des Pages React Manquantes

Ce document fournit des exemples de code pour les pages React à implémenter.

## 1. CartPage.js - Page du Panier

```jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Table } from 'react-bootstrap';
import { FaTrash, FaArrowLeft, FaLock } from 'react-icons/fa';
import { useCartStore } from '../store';
import { useAuthStore } from '../store';
import './CartPage.css';

const CartPage = () => {
  const cartItems = useCartStore(state => state.items);
  const removeItem = useCartStore(state => state.removeItem);
  const updateQuantity = useCartStore(state => state.updateQuantity);
  const cartTotal = useCartStore(state => state.getTotal());
  const user = useAuthStore(state => state.user);

  if (cartItems.length === 0) {
    return (
      <Container className="py-5 text-center">
        <h2>Votre panier est vide</h2>
        <Link to="/boutique" className="btn btn-primary">
          <FaArrowLeft /> Continuer shopping
        </Link>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <h2 className="mb-4">Mon Panier</h2>
      <Row>
        <Col lg={8}>
          <Card>
            <Table striped hover>
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Prix</th>
                  <th>Quantité</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cartItems.map(item => (
                  <tr key={item.id}>
                    <td>
                      <div className="d-flex gap-3">
                        <img
                          src={item.image_url || 'https://via.placeholder.com/50'}
                          alt={item.name}
                          style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                        />
                        <div>
                          <p className="mb-0">{item.name}</p>
                          <small className="text-muted">{item.description?.substring(0, 40)}</small>
                        </div>
                      </div>
                    </td>
                    <td>{item.price} XOF</td>
                    <td>
                      <Form.Control
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                        style={{ width: '70px' }}
                      />
                    </td>
                    <td className="fw-bold">{item.price * item.quantity} XOF</td>
                    <td>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                      >
                        <FaTrash />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        </Col>

        <Col lg={4}>
          <Card>
            <Card.Header>
              <h5>Résumé</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between mb-2">
                <span>Sous-total:</span>
                <span>{cartTotal} XOF</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Livraison:</span>
                <span>Gratuit</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between h5 mb-3">
                <strong>Total:</strong>
                <strong className="text-danger">{cartTotal} XOF</strong>
              </div>
              <Link
                to={user ? '/checkout' : '/login'}
                className="btn btn-danger w-100"
              >
                <FaLock /> Passer la commande
              </Link>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CartPage;
```

---

## 2. CheckoutPage.js - Page de Paiement

```jsx
import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { paymentService, orderService } from '../services/api';
import { useCartStore } from '../store';
import { useAuthStore } from '../store';
import { FaLock, FaCreditCard } from 'react-icons/fa';
import toast from 'react-hot-toast';
import './CheckoutPage.css';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const cartTotal = useCartStore(state => state.getTotal());
  const cartItems = useCartStore(state => state.items);
  const clearCart = useCartStore(state => state.clearCart);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    shipping_address: '',
    shipping_city: '',
    shipping_country: 'Senegal',
    shipping_postal_code: '',
    payment_method: 'paytech',
    notes: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    
    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      // Créer la commande
      const orderResponse = await orderService.create(formData);
      const orderId = orderResponse.data.orderId;

      // Initier le paiement
      const paymentResponse = await paymentService.initiatePayment(
        orderId,
        formData.payment_method
      );

      // Vider le panier
      clearCart();

      // Rediriger vers le paiement
      if (paymentResponse.data.payment_url) {
        window.location.href = paymentResponse.data.payment_url;
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la création de la commande');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <h2 className="mb-4">Finaliser votre Commande</h2>

      {cartItems.length === 0 && (
        <Alert variant="warning">
          Votre panier est vide. <a href="/boutique">Continuer le shopping</a>
        </Alert>
      )}

      <Row>
        <Col lg={8}>
          <Card className="mb-4">
            <Card.Header>
              <h5>Adresse de Livraison</h5>
            </Card.Header>
            <Card.Body>
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

              <Row>
                <Col md={6}>
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
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Code Postal</Form.Label>
                    <Form.Control
                      type="text"
                      name="shipping_postal_code"
                      value={formData.shipping_postal_code}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="mb-4">
            <Card.Header>
              <h5><FaCreditCard /> Mode de Paiement</h5>
            </Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Check
                  type="radio"
                  name="payment_method"
                  value="paytech"
                  label="PayTech (Carte bancaire)"
                  checked={formData.payment_method === 'paytech'}
                  onChange={handleChange}
                  id="paytech"
                />
                <Form.Check
                  type="radio"
                  name="payment_method"
                  value="wave"
                  label="Wave (Portefeuille mobile)"
                  checked={formData.payment_method === 'wave'}
                  onChange={handleChange}
                  id="wave"
                />
                <Form.Check
                  type="radio"
                  name="payment_method"
                  value="orange_money"
                  label="Orange Money (Portefeuille Orange)"
                  checked={formData.payment_method === 'orange_money'}
                  onChange={handleChange}
                  id="orange_money"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Notes (optionnel)</Form.Label>
                <Form.Control
                  as="textarea"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Instructions spéciales pour la livraison..."
                />
              </Form.Group>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="sticky-top">
            <Card.Header>
              <h5>Résumé de la Commande</h5>
            </Card.Header>
            <Card.Body>
              {cartItems.map(item => (
                <div key={item.id} className="d-flex justify-content-between mb-2 small">
                  <span>{item.name} x {item.quantity}</span>
                  <span className="text-end">{item.price * item.quantity} XOF</span>
                </div>
              ))}
              <hr />
              <div className="d-flex justify-content-between mb-2">
                <span>Sous-total:</span>
                <span>{cartTotal} XOF</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Livraison:</span>
                <span className="text-success">Gratuit</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between h5 mb-4">
                <strong>Total:</strong>
                <strong className="text-danger">{cartTotal} XOF</strong>
              </div>

              <Button
                variant="danger"
                size="lg"
                className="w-100"
                type="submit"
                disabled={loading || cartItems.length === 0}
                onClick={handleCheckout}
              >
                {loading ? 'Chargement...' : <><FaLock /> Payer Maintenant</>}
              </Button>

              <div className="text-center mt-3">
                <small className="text-muted d-block">
                  <FaLock /> Paiement Sécurisé
                </small>
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

## 3. ProfilePage.js - Profil Utilisateur

```jsx
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Nav, Tab, Card, Form, Button, Table } from 'react-bootstrap';
import { useAuthStore } from '../store';
import { clientService, authService } from '../services/api';
import toast from 'react-hot-toast';
import { FaUser, FaShoppingBag, FaCreditCard, FaEdit } from 'react-icons/fa';

const ProfilePage = () => {
  const user = useAuthStore(state => state.user);
  const setUser = useAuthStore(state => state.setUser);
  const token = useAuthStore(state => state.token);

  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const profileRes = await authService.getCurrentUser();
      setProfile(profileRes.data);
      setFormData(profileRes.data);

      const ordersRes = await clientService.getAll?.() || { data: [] };
      setOrders(ordersRes.data);

      const paymentsRes = await clientService.getAll?.() || { data: [] };
      setPayments(paymentsRes.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async () => {
    try {
      await authService.updateProfile(formData);
      setProfile(formData);
      setUser(formData, token);
      setEditMode(false);
      toast.success('Profil mis à jour!');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  if (loading) return <Container className="py-5">Chargement...</Container>;

  return (
    <Container className="py-5">
      <h2 className="mb-4">Mon Profil</h2>

      <Tab.Container defaultActiveKey="profile">
        <Row>
          <Col lg={3}>
            <Nav variant="pills" className="flex-column">
              <Nav.Item>
                <Nav.Link eventKey="profile">
                  <FaUser /> Profil
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="orders">
                  <FaShoppingBag /> Mes Commandes
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="payments">
                  <FaCreditCard /> Mes Paiements
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </Col>

          <Col lg={9}>
            <Tab.Content>
              <Tab.Pane eventKey="profile">
                <Card>
                  <Card.Header>
                    <div className="d-flex justify-content-between">
                      <h5>Informations Personnelles</h5>
                      <Button
                        size="sm"
                        variant={editMode ? 'success' : 'primary'}
                        onClick={() => editMode ? handleSave() : setEditMode(true)}
                      >
                        {editMode ? 'Enregistrer' : <FaEdit /> + ' Modifier'}
                      </Button>
                    </div>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Prénom</Form.Label>
                          <Form.Control
                            type="text"
                            name="first_name"
                            value={formData.first_name || ''}
                            onChange={handleChange}
                            disabled={!editMode}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Nom</Form.Label>
                          <Form.Control
                            type="text"
                            name="last_name"
                            value={formData.last_name || ''}
                            onChange={handleChange}
                            disabled={!editMode}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Email</Form.Label>
                          <Form.Control
                            type="email"
                            value={formData.email || ''}
                            disabled
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Téléphone</Form.Label>
                          <Form.Control
                            type="tel"
                            name="phone"
                            value={formData.phone || ''}
                            onChange={handleChange}
                            disabled={!editMode}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-3">
                      <Form.Label>Adresse</Form.Label>
                      <Form.Control
                        type="text"
                        name="address"
                        value={formData.address || ''}
                        onChange={handleChange}
                        disabled={!editMode}
                      />
                    </Form.Group>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Ville</Form.Label>
                          <Form.Control
                            type="text"
                            name="city"
                            value={formData.city || ''}
                            onChange={handleChange}
                            disabled={!editMode}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Code Postal</Form.Label>
                          <Form.Control
                            type="text"
                            name="postal_code"
                            value={formData.postal_code || ''}
                            onChange={handleChange}
                            disabled={!editMode}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Tab.Pane>

              <Tab.Pane eventKey="orders">
                <Card>
                  <Card.Header>
                    <h5>Mes Commandes</h5>
                  </Card.Header>
                  <Card.Body>
                    {orders.length === 0 ? (
                      <p className="text-muted">Aucune commande</p>
                    ) : (
                      <Table striped hover>
                        <thead>
                          <tr>
                            <th>N° Commande</th>
                            <th>Date</th>
                            <th>Total</th>
                            <th>Statut</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.map(order => (
                            <tr key={order.id}>
                              <td>{order.order_number}</td>
                              <td>{new Date(order.created_at).toLocaleDateString('fr-FR')}</td>
                              <td>{order.total_amount} XOF</td>
                              <td>
                                <span className={`badge bg-${
                                  order.status === 'delivered' ? 'success' :
                                  order.status === 'pending' ? 'warning' :
                                  'info'
                                }`}>
                                  {order.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    )}
                  </Card.Body>
                </Card>
              </Tab.Pane>

              <Tab.Pane eventKey="payments">
                <Card>
                  <Card.Header>
                    <h5>Mes Paiements</h5>
                  </Card.Header>
                  <Card.Body>
                    {payments.length === 0 ? (
                      <p className="text-muted">Aucun paiement</p>
                    ) : (
                      <Table striped hover>
                        <thead>
                          <tr>
                            <th>Montant</th>
                            <th>Méthode</th>
                            <th>Statut</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payments.map(payment => (
                            <tr key={payment.id}>
                              <td>{payment.amount} XOF</td>
                              <td>{payment.payment_method}</td>
                              <td>
                                <span className={`badge bg-${
                                  payment.payment_status === 'completed' ? 'success' :
                                  'warning'
                                }`}>
                                  {payment.payment_status}
                                </span>
                              </td>
                              <td>{new Date(payment.created_at).toLocaleDateString('fr-FR')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    )}
                  </Card.Body>
                </Card>
              </Tab.Pane>
            </Tab.Content>
          </Col>
        </Row>
      </Tab.Container>
    </Container>
  );
};

export default ProfilePage;
```

---

## 4. AdminPage.js - Dashboard Admin

```jsx
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Tab, Nav, Table, Button } from 'react-bootstrap';
import { statsService, clientService, orderService, productService } from '../services/api';
import { FaChartLine, FaShoppingCart, FaUsers, FaBox } from 'react-icons/fa';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

const AdminPage = () => {
  const [stats, setStats] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const statsRes = await statsService.getDashboard?.() || { data: {} };
      setStats(statsRes.data);

      const salesRes = await statsService.getSalesByDay?.() || { data: [] };
      setSalesData(salesRes.data);

      const ordersRes = await orderService.getAllAdmin?.() || { data: [] };
      setOrders(ordersRes.data.slice(0, 10));
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Container className="py-5">Chargement...</Container>;

  return (
    <Container fluid className="py-5">
      <h2 className="mb-4">Dashboard Administrateur</h2>

      {/* KPI Cards */}
      <Row className="mb-4">
        <Col md={6} lg={3}>
          <Card className="text-white bg-primary">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6>Clients</h6>
                  <h3>{stats?.clients || 0}</h3>
                </div>
                <FaUsers size={40} />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} lg={3}>
          <Card className="text-white bg-success">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6>Produits</h6>
                  <h3>{stats?.products || 0}</h3>
                </div>
                <FaBox size={40} />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} lg={3}>
          <Card className="text-white bg-warning">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6>Commandes</h6>
                  <h3>{stats?.orders || 0}</h3>
                </div>
                <FaShoppingCart size={40} />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} lg={3}>
          <Card className="text-white bg-danger">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6>Ventes Totales</h6>
                  <h3>{Math.round(stats?.totalSales || 0) / 1000}K XOF</h3>
                </div>
                <FaChartLine size={40} />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row className="mb-4">
        <Col lg={6}>
          <Card>
            <Card.Header>
              <h5>Ventes (30 derniers jours)</h5>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="total" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <Card>
            <Card.Header>
              <h5>Commandes par Statut</h5>
            </Card.Header>
            <Card.Body>
              {stats?.ordersByStatus?.map(item => (
                <div key={item.status} className="d-flex justify-content-between mb-2">
                  <span className="text-capitalize">{item.status}</span>
                  <strong>{item.count}</strong>
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Orders */}
      <Card>
        <Card.Header>
          <h5>Dernières Commandes</h5>
        </Card.Header>
        <Card.Body>
          <Table striped hover>
            <thead>
              <tr>
                <th>N° Commande</th>
                <th>Client</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td>{order.order_number}</td>
                  <td>{order.first_name} {order.last_name}</td>
                  <td>{order.total_amount} XOF</td>
                  <td>
                    <span className={`badge bg-${
                      order.status === 'delivered' ? 'success' :
                      order.status === 'pending' ? 'warning' :
                      'info'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td>{new Date(order.created_at).toLocaleDateString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AdminPage;
```

---

## 📝 Fichiers CSS Requis

Créer les fichiers CSS suivants dans `src/pages/`:
- `CartPage.css`
- `CheckoutPage.css`
- `ProfilePage.css`
- `AdminPage.css`

Avec les styles de base:

```css
/* CartPage.css */
.cart-page {
  min-height: 70vh;
}

.product-card {
  transition: transform 0.2s;
}

.product-card:hover {
  transform: translateY(-5px);
}

/* CheckoutPage.css */
.checkout-page {
  background: #f8f9fa;
}

/* ProfilePage.css */
.nav-pills .nav-link {
  color: #333;
}

.nav-pills .nav-link.active {
  background-color: #dc3545;
}

/* AdminPage.css */
.card {
  border: none;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
```

---

Ces pages fournissent une base solide. N'hésite pas à les personnaliser selon vos besoins!

