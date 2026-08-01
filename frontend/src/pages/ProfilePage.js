import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { authService, orderService } from '../services/api';
import toast from 'react-hot-toast';
import { FiUser, FiShoppingBag, FiMapPin, FiPhone, FiMail, FiEdit2, FiCheckCircle, FiDownload, FiEye } from 'react-icons/fi';
import './ProfilePage.css';

function ProfilePage() {
  const navigate = useNavigate();
  const { user, token, setUser, logout } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItemsLoading, setOrderItemsLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    postal_code: user?.postal_code || ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      loadOrders();
      // Sync form data with current user state
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        postal_code: user.postal_code || ''
      });
    }
  }, [user, navigate]);

  const loadOrders = async () => {
    try {
      const res = await orderService.getAll();
      setOrders(res.data);
    } catch (error) {
      console.error('Erreur lors du chargement des commandes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrderDetails = async (orderId) => {
    setOrderItemsLoading(true);
    try {
      const res = await orderService.getById(orderId);
      setSelectedOrder(res.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des détails de la commande');
    } finally {
      setOrderItemsLoading(false);
    }
  };

  const handleDownloadInvoice = async (orderId) => {
    try {
      toast.loading('Récupération de la facture...', { id: 'invoice-toast' });
      const res = await orderService.getInvoice(orderId);
      toast.dismiss('invoice-toast');
      
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(res.data);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 500);
      } else {
        toast.error('Veuillez désactiver votre bloqueur de pop-up pour imprimer.');
      }
    } catch (error) {
      toast.dismiss('invoice-toast');
      console.error(error);
      toast.error('La facture n\'est pas encore générée (la commande doit être payée)');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await authService.updateProfile(formData);
      setUser({ ...user, ...formData }, token);
      toast.success('Profil mis à jour avec succès');
      setEditMode(false);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="profile-page py-5">
      <div className="container">
        <h1 className="fw-extrabold text-dark mb-4">Mon Compte</h1>

        <div className="row g-4">
          {/* Informations Profil */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
              <div className="text-center mb-4">
                <div className="avatar-circle mx-auto mb-3 bg-primary-subtle text-primary d-flex align-items-center justify-content-center">
                  <FiUser size={40} />
                </div>
                <h5 className="fw-bold text-dark mb-1">
                  {user.first_name} {user.last_name}
                </h5>
                <span className="badge bg-secondary text-uppercase">{user.role}</span>
              </div>

              <hr className="text-muted" />

              {!editMode ? (
                <div className="profile-info-details">
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <FiMail className="text-secondary" />
                    <div>
                      <small className="text-muted d-block">E-mail</small>
                      <span className="fw-semibold text-dark">{user.email}</span>
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-3 mb-3">
                    <FiPhone className="text-secondary" />
                    <div>
                      <small className="text-muted d-block">Téléphone</small>
                      <span className="fw-semibold text-dark">{user.phone || 'Non renseigné'}</span>
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-3 mb-4">
                    <FiMapPin className="text-secondary" />
                    <div>
                      <small className="text-muted d-block">Adresse de livraison</small>
                      <span className="fw-semibold text-dark">
                        {user.address ? `${user.address}, ${user.city || ''} (${user.postal_code || ''})` : 'Non renseignée'}
                      </span>
                    </div>
                  </div>

                  <button
                    className="btn btn-outline-primary w-100 rounded-pill py-2 fw-bold d-flex align-items-center justify-content-center gap-2"
                    onClick={() => setEditMode(true)}
                  >
                    <FiEdit2 /> Modifier le profil
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSave}>
                  <div className="mb-3">
                    <label className="form-label text-secondary small fw-bold">Prénom</label>
                    <input
                      type="text"
                      className="form-control rounded-3"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-secondary small fw-bold">Nom</label>
                    <input
                      type="text"
                      className="form-control rounded-3"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-secondary small fw-bold">Téléphone</label>
                    <input
                      type="tel"
                      className="form-control rounded-3"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-secondary small fw-bold">Adresse</label>
                    <input
                      type="text"
                      className="form-control rounded-3"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="row">
                    <div className="col-6 mb-3">
                      <label className="form-label text-secondary small fw-bold">Ville</label>
                      <input
                        type="text"
                        className="form-control rounded-3"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-6 mb-3">
                      <label className="form-label text-secondary small fw-bold">Code postal</label>
                      <input
                        type="text"
                        className="form-control rounded-3"
                        name="postal_code"
                        value={formData.postal_code}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="d-flex gap-2 mt-4">
                    <button
                      type="submit"
                      className="btn btn-success w-100 rounded-pill py-2 fw-bold d-flex align-items-center justify-content-center gap-1"
                    >
                      <FiCheckCircle /> Enregistrer
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary w-100 rounded-pill py-2"
                      onClick={() => setEditMode(false)}
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              )}

              <hr className="text-muted my-4" />

              <button
                className="btn btn-danger w-100 rounded-pill py-2 fw-bold"
                onClick={() => {
                  logout();
                  navigate('/');
                }}
              >
                Déconnexion
              </button>
            </div>
          </div>

          {/* Liste des Commandes */}
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
              <h5 className="fw-bold text-dark mb-4 d-flex align-items-center gap-2">
                <FiShoppingBag className="text-primary" /> Mes commandes
              </h5>

              {/* Suivi de la commande sélectionnée */}
              {orderItemsLoading ? (
                <div className="text-center py-5 border border-primary-subtle rounded-4 bg-light mb-4 shadow-sm">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Chargement des détails...</span>
                  </div>
                </div>
              ) : selectedOrder && (
                <div className="border border-primary-subtle rounded-4 p-4 mb-4 bg-light shadow-sm">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="fw-bold mb-0 text-primary">Suivi de la Commande #{selectedOrder.order_number}</h5>
                    <button className="btn-close" onClick={() => setSelectedOrder(null)}></button>
                  </div>
                  
                  {selectedOrder.status === 'cancelled' ? (
                    <div className="alert alert-danger rounded-3 mb-4">Cette commande a été annulée.</div>
                  ) : (
                    <div className="my-5 position-relative" style={{ height: '70px' }}>
                      <div className="progress position-absolute w-75 top-50 start-50 translate-middle" style={{ height: '4px', zIndex: 0 }}>
                        <div
                          className="progress-bar bg-success"
                          role="progressbar"
                          style={{
                            width:
                              selectedOrder.status === 'pending' ? '0%' :
                              selectedOrder.status === 'confirmed' ? '33.3%' :
                              selectedOrder.status === 'shipped' ? '66.6%' : '100%'
                          }}
                        ></div>
                      </div>
                      <div className="d-flex justify-content-between position-absolute w-100 top-50 start-50 translate-middle">
                        {[
                          { label: 'En attente', key: 'pending' },
                          { label: 'Confirmé', key: 'confirmed' },
                          { label: 'Expédié', key: 'shipped' },
                          { label: 'Livré', key: 'delivered' }
                        ].map((step, idx) => {
                          const statusKeys = ['pending', 'confirmed', 'shipped', 'delivered'];
                          const currentIdx = statusKeys.indexOf(selectedOrder.status);
                          const stepIdx = statusKeys.indexOf(step.key);
                          const isCompleted = stepIdx <= currentIdx;
                          return (
                            <div key={idx} className="text-center" style={{ width: '80px', zIndex: 1 }}>
                              <div
                                className={`rounded-circle mx-auto d-flex align-items-center justify-content-center border shadow-sm ${
                                  isCompleted ? 'bg-success text-white border-success' : 'bg-white text-muted border-secondary-subtle'
                                }`}
                                style={{ width: '28px', height: '28px' }}
                              >
                                {idx + 1}
                              </div>
                              <span className="small fw-semibold d-block mt-1 text-dark" style={{ fontSize: '0.7rem' }}>
                                {step.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <h6 className="fw-bold mb-2 mt-4">Articles commandés</h6>
                  <div className="table-responsive bg-white rounded-3 border mb-3">
                    <table className="table align-middle table-sm mb-0">
                      <thead>
                        <tr className="table-light">
                          <th className="ps-3 text-secondary small">Produit</th>
                          <th className="text-center text-secondary small">Qté</th>
                          <th className="text-end pe-3 text-secondary small">Prix</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.items?.map((item, idx) => (
                          <tr key={idx}>
                            <td className="ps-3 fw-medium text-dark">{item.name}</td>
                            <td className="text-center text-dark">{item.quantity}</td>
                            <td className="text-end pe-3 fw-bold text-success">{parseFloat(item.total_price).toLocaleString()} XOF</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
                    <div>
                      <span className="text-muted small">Total Commande : </span>
                      <strong className="text-dark fs-5">{parseFloat(selectedOrder.total_amount).toLocaleString()} XOF</strong>
                    </div>
                    {(selectedOrder.status === 'confirmed' || selectedOrder.status === 'delivered' || selectedOrder.status === 'shipped') && (
                      <button
                        className="btn btn-outline-primary btn-sm rounded-pill px-3 fw-bold d-flex align-items-center gap-1"
                        onClick={() => handleDownloadInvoice(selectedOrder.id)}
                      >
                        <FiDownload /> Facture PDF
                      </button>
                    )}
                  </div>
                </div>
              )}

              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Chargement...</span>
                  </div>
                </div>
              ) : orders.length === 0 ? (
                <div className="alert alert-info rounded-4 border-0 p-4 text-center">
                  Aucune commande enregistrée pour le moment.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead>
                      <tr className="table-light">
                        <th className="border-0">Numéro</th>
                        <th className="border-0">Date</th>
                        <th className="border-0">Montant</th>
                        <th className="border-0">Statut</th>
                        <th className="border-0 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(order => (
                        <tr key={order.id}>
                          <td className="fw-bold text-dark">#{order.order_number}</td>
                          <td className="text-muted">{new Date(order.created_at).toLocaleDateString('fr-FR')}</td>
                          <td className="fw-semibold text-dark">{parseFloat(order.total_amount).toLocaleString('fr-FR')} XOF</td>
                          <td>
                            <span className={`badge px-3 py-1.5 rounded-pill text-capitalize bg-${
                              order.status === 'confirmed' || order.status === 'delivered' ? 'success' :
                              order.status === 'pending' ? 'warning' : 'danger'
                            }`}>
                              {order.status === 'pending' ? 'En attente' :
                               order.status === 'confirmed' ? 'Confirmé' :
                               order.status === 'delivered' ? 'Livré' :
                               order.status === 'cancelled' ? 'Annulé' : order.status}
                            </span>
                          </td>
                          <td className="text-center">
                            <button
                              className="btn btn-sm btn-outline-primary border-0 rounded-circle p-2 me-1"
                              onClick={() => handleViewOrderDetails(order.id)}
                              title="Détails & Suivi"
                            >
                              <FiEye size={16} />
                            </button>
                            {(order.status === 'confirmed' || order.status === 'delivered' || order.status === 'shipped') && (
                              <button
                                className="btn btn-sm btn-outline-success border-0 rounded-circle p-2"
                                onClick={() => handleDownloadInvoice(order.id)}
                                title="Télécharger facture PDF"
                              >
                                <FiDownload size={16} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
