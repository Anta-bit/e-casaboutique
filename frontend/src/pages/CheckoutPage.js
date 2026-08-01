import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore, useAuthStore } from '../store';
import { paymentService, orderService } from '../services/api';
import toast from 'react-hot-toast';
import { FiLock, FiCreditCard, FiMapPin, FiBookOpen } from 'react-icons/fi';
import './CheckoutPage.css';

function CheckoutPage() {
  const navigate = useNavigate();
  const { items, getTotal, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('paytech');
  const [orderData, setOrderData] = useState({
    adresse: user?.address || '',
    ville: user?.city || '',
    codePostal: user?.postal_code || '',
    notes: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setOrderData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!user) {
        toast.error('Vous devez être connecté pour commander');
        navigate('/login');
        return;
      }

      // 1. Créer la commande (les articles sont récupérés du panier MySQL par le backend)
      const orderRes = await orderService.create({
        shipping_address: orderData.adresse,
        shipping_city: orderData.ville,
        shipping_country: 'Senegal',
        shipping_postal_code: orderData.codePostal,
        notes: orderData.notes
      });

      const orderId = orderRes.data.orderId;

      if (!orderId) {
        toast.error('Erreur lors de la création de la commande');
        setLoading(false);
        return;
      }

      toast.success('Commande créée ! Initiation du paiement...');

      // 2. Initier le paiement avec les bons arguments (order_id, payment_method)
      const paymentRes = await paymentService.initiatePayment(
        orderId,
        paymentMethod
      );

      // 3. Vider le panier local/store
      clearCart();

      // 4. Rediriger vers l'URL de paiement retournée par PayTech/Wave/Orange Money
      if (paymentRes.data.payment_url) {
        window.location.href = paymentRes.data.payment_url;
      } else {
        toast.success('Commande enregistrée (Simulation de paiement)');
        navigate('/profile');
      }
    } catch (error) {
      console.error('Erreur lors du checkout:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la commande. Veuillez vérifier vos informations.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-warning p-4 rounded-4 border-0 shadow-sm">
          <h4 className="fw-bold mb-2">Votre panier est vide</h4>
          <p className="text-muted mb-4">Veuillez ajouter des produits à votre panier avant de procéder au paiement.</p>
          <a href="/boutique" className="btn btn-primary rounded-pill px-4 fw-bold">Retour à la boutique</a>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page py-5">
      <div className="container">
        <h1 className="fw-extrabold text-dark mb-4">Finaliser ma commande</h1>

        <div className="row g-4">
          {/* Formulaire de livraison & paiement */}
          <div className="col-lg-8">
            <form onSubmit={handleSubmit}>
              
              {/* Adresse de livraison */}
              <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
                <h5 className="fw-bold text-dark mb-4 d-flex align-items-center gap-2">
                  <FiMapPin className="text-primary" /> 1. Adresse de Livraison
                </h5>

                <div className="mb-3">
                  <label className="form-label text-secondary fw-semibold">Adresse complète</label>
                  <input
                    type="text"
                    className="form-control rounded-3 py-2"
                    name="adresse"
                    value={orderData.adresse}
                    onChange={handleInputChange}
                    placeholder="Ex: Rue 10, Zone A, Villa 124"
                    required
                  />
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label text-secondary fw-semibold">Ville</label>
                    <input
                      type="text"
                      className="form-control rounded-3 py-2"
                      name="ville"
                      value={orderData.ville}
                      onChange={handleInputChange}
                      placeholder="Ex: Dakar"
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label text-secondary fw-semibold">Code postal</label>
                    <input
                      type="text"
                      className="form-control rounded-3 py-2"
                      name="codePostal"
                      value={orderData.codePostal}
                      onChange={handleInputChange}
                      placeholder="Ex: 12500"
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label text-secondary fw-semibold">Notes de livraison (optionnel)</label>
                  <textarea
                    className="form-control rounded-3"
                    name="notes"
                    rows="3"
                    value={orderData.notes}
                    onChange={handleInputChange}
                    placeholder="Instructions particulières pour le livreur (ex: code d'entrée, point de repère)..."
                  ></textarea>
                </div>
              </div>

              {/* Mode de paiement */}
              <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
                <h5 className="fw-bold text-dark mb-4 d-flex align-items-center gap-2">
                  <FiCreditCard className="text-success" /> 2. Mode de Paiement
                </h5>

                <div className="payment-options d-flex flex-column gap-3">
                  <label className={`payment-option-card d-flex align-items-center p-3 rounded-4 border transition-all cursor-pointer ${paymentMethod === 'paytech' ? 'active border-primary bg-primary-subtle' : 'border-light-subtle'}`}>
                    <input
                      type="radio"
                      name="payment"
                      value="paytech"
                      checked={paymentMethod === 'paytech'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="form-check-input me-3"
                    />
                    <div className="d-flex align-items-center justify-content-between w-100">
                      <div>
                        <h6 className="fw-bold mb-1 text-dark">PayTech (CB / Visa / Mastercard)</h6>
                        <small className="text-muted">Paiement sécurisé par carte bancaire nationale et internationale.</small>
                      </div>
                      <span className="fs-3">💳</span>
                    </div>
                  </label>

                  <label className={`payment-option-card d-flex align-items-center p-3 rounded-4 border transition-all cursor-pointer ${paymentMethod === 'wave' ? 'active border-primary bg-primary-subtle' : 'border-light-subtle'}`}>
                    <input
                      type="radio"
                      name="payment"
                      value="wave"
                      checked={paymentMethod === 'wave'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="form-check-input me-3"
                    />
                    <div className="d-flex align-items-center justify-content-between w-100">
                      <div>
                        <h6 className="fw-bold mb-1 text-dark">Wave</h6>
                        <small className="text-muted">Payez instantanément avec votre portefeuille mobile Wave.</small>
                      </div>
                      <span className="fs-3">🌊</span>
                    </div>
                  </label>

                  <label className={`payment-option-card d-flex align-items-center p-3 rounded-4 border transition-all cursor-pointer ${paymentMethod === 'orange_money' ? 'active border-primary bg-primary-subtle' : 'border-light-subtle'}`}>
                    <input
                      type="radio"
                      name="payment"
                      value="orange_money"
                      checked={paymentMethod === 'orange_money'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="form-check-input me-3"
                    />
                    <div className="d-flex align-items-center justify-content-between w-100">
                      <div>
                        <h6 className="fw-bold mb-1 text-dark">Orange Money</h6>
                        <small className="text-muted">Réglez via votre compte Orange Money Sénégal.</small>
                      </div>
                      <span className="fs-3">🍊</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Validation */}
              <button
                type="submit"
                className="btn btn-primary btn-lg w-100 rounded-pill py-3 fw-extrabold shadow transition-all d-flex align-items-center justify-content-center gap-2"
                disabled={loading}
              >
                {loading ? 'Traitement en cours...' : <><FiLock /> Valider et Payer {getTotal().toLocaleString('fr-FR')} XOF</>}
              </button>
            </form>
          </div>

          {/* Résumé de la commande */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white position-sticky" style={{ top: '100px' }}>
              <h5 className="fw-bold text-dark mb-4 d-flex align-items-center gap-2">
                <FiBookOpen className="text-secondary" /> Résumé de la commande
              </h5>

              <div className="checkout-items-list mb-3 overflow-y-auto" style={{ maxHeight: '240px' }}>
                {items.map(item => (
                  <div key={item.id} className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom border-light">
                    <div className="d-flex align-items-center gap-2">
                      <img
                        src={item.image_url || 'https://via.placeholder.com/50'}
                        alt={item.name}
                        className="rounded border"
                        style={{ width: '40px', height: '40px', objectFit: 'contain' }}
                      />
                      <div>
                        <h6 className="fw-bold mb-0 text-dark small text-truncate" style={{ maxWidth: '140px' }}>{item.name}</h6>
                        <small className="text-muted">{item.quantity} x {parseFloat(item.price).toLocaleString('fr-FR')} XOF</small>
                      </div>
                    </div>
                    <span className="fw-bold text-dark small">{(item.price * item.quantity).toLocaleString('fr-FR')} XOF</span>
                  </div>
                ))}
              </div>

              <div className="d-flex justify-content-between mb-2 small text-secondary">
                <span>Sous-total</span>
                <span>{getTotal().toLocaleString('fr-FR')} XOF</span>
              </div>
              <div className="d-flex justify-content-between mb-3 small text-secondary">
                <span>Frais de livraison</span>
                <span className="text-success fw-bold">Gratuit</span>
              </div>

              <hr className="text-muted" />

              <div className="d-flex justify-content-between fs-5 fw-extrabold text-dark mb-0">
                <span>Total</span>
                <span className="text-primary">{getTotal().toLocaleString('fr-FR')} XOF</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutPage;
