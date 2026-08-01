import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store';
import { FiTrash2, FiShoppingBag, FiArrowLeft, FiLoader } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './CartPage.css';

function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, getTotal, fetchCart, loading } = useCartStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const handleRemove = async (productId) => {
    await removeItem(productId);
    toast.success('Produit supprimé du panier');
  };

  const handleClear = async () => {
    if (window.confirm('Voulez-vous vraiment vider votre panier ?')) {
      await clearCart();
      toast.success('Panier vidé');
    }
  };

  const handleQuantityChange = async (productId, newQty) => {
    const qty = Math.max(1, parseInt(newQty) || 1);
    await updateQuantity(productId, qty);
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      toast.error('Votre panier est vide');
      return;
    }
    navigate('/checkout');
  };

  if (loading && items.length === 0) {
    return (
      <div className="cart-page d-flex align-items-center justify-content-center py-5">
        <div className="text-center py-5">
          <FiLoader className="text-primary spinner-border border-0 bg-transparent mb-3" size={40} />
          <h5 className="fw-bold text-muted">Chargement de votre panier...</h5>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page py-5">
      <div className="container">
        <h1 className="fw-extrabold text-dark mb-4 d-flex align-items-center gap-2">
          🛒 Mon Panier
        </h1>

        {items.length === 0 ? (
          <div className="card border-0 shadow-sm p-5 text-center rounded-4">
            <div className="p-4 bg-light rounded-circle d-inline-block mx-auto mb-4" style={{ width: '100px', height: '100px' }}>
              <FiShoppingBag className="text-muted" size={48} />
            </div>
            <h3 className="fw-bold text-dark mb-2">Votre panier est vide</h3>
            <p className="text-muted mb-4">Parcourez notre catalogue et découvrez nos meilleures offres !</p>
            <Link to="/boutique" className="btn btn-primary px-4 py-2 rounded-pill fw-bold">
              Continuer les achats
            </Link>
          </div>
        ) : (
          <div className="row g-4">
            {/* Table des Articles */}
            <div className="col-lg-8">
              <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                <div className="table-responsive">
                  <table className="table align-middle mb-0">
                    <thead className="bg-light table-light">
                      <tr>
                        <th className="px-4 py-3 border-0 text-secondary">Produit</th>
                        <th className="py-3 border-0 text-secondary">Prix</th>
                        <th className="py-3 border-0 text-secondary text-center">Quantité</th>
                        <th className="py-3 border-0 text-secondary text-end">Total</th>
                        <th className="px-4 py-3 border-0 text-secondary text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map(item => (
                        <tr key={item.id}>
                          <td className="px-4 py-3">
                            <div className="d-flex align-items-center gap-3">
                              <img
                                src={item.image_url || 'https://via.placeholder.com/80'}
                                alt={item.name}
                                className="rounded-3 shadow-sm border"
                                style={{ width: '70px', height: '70px', objectFit: 'contain' }}
                              />
                              <div>
                                <h6 className="fw-bold mb-1 text-dark">{item.name}</h6>
                                <span className="text-muted small">ID: #{item.id}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 fw-semibold text-dark">
                            {parseFloat(item.price).toLocaleString('fr-FR')} XOF
                          </td>
                          <td className="py-3 text-center">
                            <div className="d-inline-flex align-items-center bg-light rounded-3 p-1">
                              <button
                                className="btn btn-sm btn-link text-secondary text-decoration-none fw-bold px-2 py-0 border-0"
                                onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                              >
                                -
                              </button>
                              <span className="fw-bold px-2 text-dark">{item.quantity}</span>
                              <button
                                className="btn btn-sm btn-link text-secondary text-decoration-none fw-bold px-2 py-0 border-0"
                                onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="py-3 text-end fw-bold text-dark">
                            {(item.price * item.quantity).toLocaleString('fr-FR')} XOF
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              className="btn btn-sm btn-outline-danger border-0 rounded-circle p-2"
                              onClick={() => handleRemove(item.id)}
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="card-footer bg-white p-3 border-0 d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <Link to="/boutique" className="btn btn-link text-primary fw-bold text-decoration-none d-flex align-items-center gap-2">
                    <FiArrowLeft /> Continuer les achats
                  </Link>
                  <button
                    className="btn btn-outline-danger fw-bold rounded-pill px-4"
                    onClick={handleClear}
                  >
                    Vider le panier
                  </button>
                </div>
              </div>
            </div>

            {/* Résumé de Commande */}
            <div className="col-lg-4">
              <div className="card border-0 shadow-sm rounded-4 p-4 summary-card bg-white position-sticky" style={{ top: '100px' }}>
                <h4 className="fw-bold mb-4 text-dark">Résumé de la Commande</h4>
                
                <div className="d-flex justify-content-between mb-3 fs-6">
                  <span className="text-secondary">Sous-total</span>
                  <span className="fw-semibold text-dark">{getTotal().toLocaleString('fr-FR')} XOF</span>
                </div>
                
                <div className="d-flex justify-content-between mb-3 fs-6">
                  <span className="text-secondary">Frais de port</span>
                  <span className="text-success fw-bold">Gratuit</span>
                </div>
                
                <hr className="my-3 text-muted" />
                
                <div className="d-flex justify-content-between mb-4 fs-5 fw-bold">
                  <span className="text-dark">Total</span>
                  <span className="text-primary">{getTotal().toLocaleString('fr-FR')} XOF</span>
                </div>

                <button
                  className="btn btn-primary w-100 rounded-pill py-3 fw-bold shadow-sm transition-all fs-6"
                  onClick={handleCheckout}
                >
                  Procéder au paiement
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CartPage;
