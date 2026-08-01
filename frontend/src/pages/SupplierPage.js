import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { 
  productService, 
  categoryService, 
  supplierService
} from '../services/api';
import toast from 'react-hot-toast';
import { 
  FiSettings, FiBox, FiShoppingCart, FiUser, FiBarChart2, 
  FiPlus, FiTrash2, FiEdit, FiEye, FiDollarSign, FiTruck
} from 'react-icons/fi';
import './SupplierPage.css';

function SupplierPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Data lists
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [salesData, setSalesData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  
  // Profile state
  const [profile, setProfile] = useState({
    name: '', email: '', phone: '', address: '', city: '', country: 'Senegal', company_name: '', tax_number: ''
  });

  const [loading, setLoading] = useState(true);

  // Form states
  const [productForm, setProductForm] = useState({
    id: null, name: '', description: '', price: '', original_price: '', 
    category_id: '', stock: '', image_url: '', discount_percent: ''
  });
  const [showProductForm, setShowProductForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    if (!user || user.role !== 'supplier') {
      navigate('/');
    } else {
      loadAllData();
    }
  }, [user, navigate]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // 1. Charger le profil professionnel
      const profileRes = await supplierService.getMyProfile();
      setProfile(profileRes.data || {});

      // 2. Charger les stats, produits, catégories et commandes
      const [statsRes, prodRes, catRes, ordRes] = await Promise.all([
        supplierService.getMyStats(),
        productService.getAll(), // Filtre pour mes produits sera appliqué côté client ou via requête
        categoryService.getAll(),
        supplierService.getMyOrders()
      ]);

      const mySupplierId = profileRes.data.id;
      
      // Filtrer les produits du catalogue pour n'avoir que ceux du fournisseur
      const myProducts = prodRes.data.filter(p => p.supplier_id === mySupplierId);
      setProducts(myProducts);

      setCategories(catRes.data || []);
      setOrders(ordRes.data || []);
      setStats(statsRes.data || {});
      setSalesData(statsRes.data.salesByDay || []);
      setTopProducts(statsRes.data.topProducts || []);

    } catch (error) {
      console.error('Erreur de chargement fournisseur:', error);
      toast.error('Erreur lors du chargement de l\'espace professionnel');
    } finally {
      setLoading(false);
    }
  };

  // --- CRUD PRODUITS ---
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...productForm,
        supplier_id: profile.id // Définir explicitement le supplier_id
      };
      
      if (productForm.id) {
        await productService.update(productForm.id, payload);
        toast.success('Produit mis à jour !');
      } else {
        await productService.create(payload);
        toast.success('Produit créé avec succès !');
      }
      setShowProductForm(false);
      resetProductForm();
      loadAllData();
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement de l'article");
    }
  };

  const handleEditProduct = (prod) => {
    setProductForm({
      id: prod.id,
      name: prod.name,
      description: prod.description || '',
      price: prod.price,
      original_price: prod.original_price || '',
      category_id: prod.category_id || '',
      stock: prod.stock || 0,
      image_url: prod.image_url || '',
      discount_percent: prod.discount_percent || 0
    });
    setShowProductForm(true);
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Voulez-vous supprimer ce produit ?')) {
      try {
        await productService.delete(id);
        toast.success('Produit supprimé');
        loadAllData();
      } catch (error) {
        toast.error('Erreur lors de la suppression de l\'article');
      }
    }
  };

  const resetProductForm = () => {
    setProductForm({
      id: null, name: '', description: '', price: '', original_price: '', 
      category_id: '', stock: '', image_url: '', discount_percent: ''
    });
  };

  // --- UPDATE PRO PROFILE ---
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      await supplierService.updateMyProfile(profile);
      toast.success('Profil professionnel mis à jour !');
      loadAllData();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du profil');
    }
  };

  // Calcul du max pour le graphique SVG des ventes
  const maxSales = Math.max(...salesData.map(s => parseFloat(s.total) || 0), 1000);

  return (
    <div className="supplier-page py-5">
      <div className="container-fluid px-4">
        <h1 className="fw-extrabold text-dark mb-4 d-flex align-items-center gap-2">
          <FiSettings className="spin" /> Espace Fournisseur : {profile.company_name}
        </h1>

        <div className="row g-4">
          {/* Menu Sidebar */}
          <div className="col-lg-2">
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white sidebar-nav p-2">
              <button className={`btn-sidebar ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
                <FiBarChart2 className="me-2" /> Dashboard
              </button>
              <button className={`btn-sidebar ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>
                <FiBox className="me-2" /> Mes Articles
              </button>
              <button className={`btn-sidebar ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
                <FiShoppingCart className="me-2" /> Commandes
              </button>
              <button className={`btn-sidebar ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
                <FiUser className="me-2" /> Profil Pro
              </button>
            </div>
          </div>

          {/* Zone de Contenu */}
          <div className="col-lg-10">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Chargement de votre espace...</span>
                </div>
              </div>
            ) : (
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                
                {/* 1. DASHBOARD */}
                {activeTab === 'dashboard' && (
                  <div>
                    <h3 className="fw-bold mb-4 text-dark border-bottom pb-2">Tableau de Bord</h3>
                    
                    {/* KPI Cards */}
                    <div className="row g-4 mb-4">
                      <div className="col-md-3">
                        <div className="kpi-card bg-primary-subtle text-primary p-4 rounded-4 d-flex align-items-center justify-content-between">
                          <div>
                            <h6 className="text-uppercase fw-bold text-secondary mb-1">Ventes totales</h6>
                            <h3 className="fw-extrabold mb-0">{(parseFloat(stats.totalSales) || 0).toLocaleString()} XOF</h3>
                          </div>
                          <FiDollarSign size={40} />
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="kpi-card bg-success-subtle text-success p-4 rounded-4 d-flex align-items-center justify-content-between">
                          <div>
                            <h6 className="text-uppercase fw-bold text-secondary mb-1">Commandes</h6>
                            <h3 className="fw-extrabold mb-0">{stats.orders || 0}</h3>
                          </div>
                          <FiShoppingCart size={40} />
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="kpi-card bg-info-subtle text-info p-4 rounded-4 d-flex align-items-center justify-content-between">
                          <div>
                            <h6 className="text-uppercase fw-bold text-secondary mb-1">Articles actifs</h6>
                            <h3 className="fw-extrabold mb-0">{stats.products || 0}</h3>
                          </div>
                          <FiBox size={40} />
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="kpi-card bg-warning-subtle text-warning p-4 rounded-4 d-flex align-items-center justify-content-between">
                          <div>
                            <h6 className="text-uppercase fw-bold text-secondary mb-1">Stock total</h6>
                            <h3 className="fw-extrabold mb-0">{stats.stock || 0}</h3>
                          </div>
                          <FiTruck size={40} />
                        </div>
                      </div>
                    </div>

                    <div className="row g-4 mt-2">
                      {/* Graphique SVG des ventes */}
                      <div className="col-lg-8">
                        <div className="card border p-4 rounded-4 h-100 shadow-sm bg-white">
                          <h5 className="fw-bold mb-4 text-dark">Vos Ventes Récentes (30 derniers jours)</h5>
                          {salesData.length === 0 ? (
                            <div className="text-center py-5 text-muted">Aucune commande récente pour le moment.</div>
                          ) : (
                            <div className="d-flex align-items-end justify-content-between px-3 pt-3" style={{ height: '260px' }}>
                              {salesData.slice(-10).map((item, index) => (
                                <div key={index} className="d-flex flex-column align-items-center flex-grow-1" style={{ maxWidth: '60px' }}>
                                  <div 
                                    className="bg-primary rounded-top-2 w-50 position-relative bar-chart-col" 
                                    style={{ 
                                      height: `${((parseFloat(item.total) || 0) / maxSales) * 180}px`,
                                      transition: 'height 0.8s ease'
                                    }}
                                  >
                                    <span className="bar-tooltip small bg-dark text-white px-2 py-1 rounded position-absolute text-nowrap">
                                      {parseFloat(item.total).toLocaleString()} XOF
                                    </span>
                                  </div>
                                  <span className="small text-muted mt-2 text-center" style={{ fontSize: '0.7rem' }}>
                                    {new Date(item.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Top Articles */}
                      <div className="col-lg-4">
                        <div className="card border p-4 rounded-4 h-100 shadow-sm bg-white">
                          <h5 className="fw-bold mb-4 text-dark">Vos 5 Meilleurs Articles</h5>
                          {topProducts.length === 0 ? (
                            <div className="text-center py-5 text-muted">Aucune vente enregistrée pour vos articles.</div>
                          ) : (
                            <div className="d-flex flex-column gap-3">
                              {topProducts.map((p, index) => (
                                <div key={index} className="border-bottom pb-2">
                                  <div className="d-flex justify-content-between small fw-bold text-dark mb-1">
                                    <span>{p.name}</span>
                                    <span className="text-success">{parseFloat(p.revenue).toLocaleString()} XOF</span>
                                  </div>
                                  <small className="text-muted">{p.total_sold} vendus</small>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. MES ARTICLES */}
                {activeTab === 'products' && (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
                      <h3 className="fw-bold mb-0 text-dark">Gestion de Vos Articles</h3>
                      {!showProductForm && (
                        <button className="btn btn-primary rounded-pill d-flex align-items-center gap-2" onClick={() => { resetProductForm(); setShowProductForm(true); }}>
                          <FiPlus /> Ajouter un article
                        </button>
                      )}
                    </div>

                    {showProductForm ? (
                      <form onSubmit={handleProductSubmit} className="border p-4 rounded-4 shadow-sm bg-light">
                        <h5 className="fw-bold mb-4 text-dark">{productForm.id ? 'Modifier l\'article' : 'Nouvel article'}</h5>
                        <div className="row">
                          <div className="col-md-6 mb-3">
                            <label className="form-label text-secondary fw-semibold">Nom du produit *</label>
                            <input type="text" className="form-control rounded-3" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} required />
                          </div>
                          <div className="col-md-6 mb-3">
                            <label className="form-label text-secondary fw-semibold">Catégorie *</label>
                            <select className="form-select rounded-3" value={productForm.category_id} onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })} required>
                              <option value="">Sélectionner...</option>
                              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                          </div>
                        </div>

                        <div className="row">
                          <div className="col-md-4 mb-3">
                            <label className="form-label text-secondary fw-semibold">Prix de vente (XOF) *</label>
                            <input type="number" className="form-control rounded-3" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} required />
                          </div>
                          <div className="col-md-4 mb-3">
                            <label className="form-label text-secondary fw-semibold">Prix original barré (Optionnel - XOF)</label>
                            <input type="number" className="form-control rounded-3" value={productForm.original_price} onChange={(e) => setProductForm({ ...productForm, original_price: e.target.value })} />
                          </div>
                          <div className="col-md-4 mb-3">
                            <label className="form-label text-secondary fw-semibold">Stock disponible *</label>
                            <input type="number" className="form-control rounded-3" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} required />
                          </div>
                        </div>

                        <div className="row">
                          <div className="col-md-9 mb-3">
                            <label className="form-label text-secondary fw-semibold">URL de l'image</label>
                            <input type="text" className="form-control rounded-3" value={productForm.image_url} onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })} placeholder="Ex: https://..." />
                          </div>
                          <div className="col-md-3 mb-3">
                            <label className="form-label text-secondary fw-semibold">Pourcentage de réduction (%)</label>
                            <input type="number" className="form-control rounded-3" value={productForm.discount_percent} onChange={(e) => setProductForm({ ...productForm, discount_percent: e.target.value })} />
                          </div>
                        </div>

                        <div className="mb-4">
                          <label className="form-label text-secondary fw-semibold">Description de l'article</label>
                          <textarea className="form-control rounded-3" rows="3" value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}></textarea>
                        </div>

                        <div className="d-flex gap-2">
                          <button type="submit" className="btn btn-success rounded-pill px-4 fw-bold">Enregistrer</button>
                          <button type="button" className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setShowProductForm(false)}>Annuler</button>
                        </div>
                      </form>
                    ) : (
                      <div className="table-responsive">
                        <table className="table align-middle table-hover">
                          <thead>
                            <tr className="table-light">
                              <th>Image</th>
                              <th>Nom</th>
                              <th>Prix</th>
                              <th>Stock</th>
                              <th>Catégorie</th>
                              <th className="text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {products.length === 0 ? (
                              <tr>
                                <td colSpan="6" className="text-center py-4 text-muted">Aucun article dans votre catalogue.</td>
                              </tr>
                            ) : products.map(p => (
                              <tr key={p.id}>
                                <td>
                                  <img src={p.image_url || 'https://via.placeholder.com/50'} alt={p.name} className="rounded border" style={{ width: '45px', height: '45px', objectFit: 'contain' }} />
                                </td>
                                <td className="fw-bold text-dark">{p.name}</td>
                                <td className="fw-semibold">{parseFloat(p.price).toLocaleString()} XOF</td>
                                <td>
                                  <span className={`badge px-2 py-1 bg-${p.stock > 0 ? 'success-subtle text-success' : 'danger-subtle text-danger'}`}>
                                    {p.stock}
                                  </span>
                                </td>
                                <td>{p.category_name || 'Boutique'}</td>
                                <td className="text-center">
                                  <button className="btn btn-sm btn-outline-warning border-0 rounded-circle p-2 me-2" onClick={() => handleEditProduct(p)}>
                                    <FiEdit size={16} />
                                  </button>
                                  <button className="btn btn-sm btn-outline-danger border-0 rounded-circle p-2" onClick={() => handleDeleteProduct(p.id)}>
                                    <FiTrash2 size={16} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. COMMANDES REÇUES */}
                {activeTab === 'orders' && (
                  <div>
                    <h3 className="fw-bold mb-4 text-dark border-bottom pb-2">Commandes Clients Reçues</h3>
                    
                    {selectedOrder && (
                      <div className="border border-primary p-4 rounded-4 shadow-sm bg-primary-subtle mb-4">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h5 className="fw-bold mb-0 text-primary">Détails Commande #{selectedOrder.order_number}</h5>
                          <button className="btn-close" onClick={() => setSelectedOrder(null)}></button>
                        </div>
                        <p className="small text-muted mb-2">Statut livraison global : <span className="fw-bold text-capitalize">{selectedOrder.status}</span></p>
                        <p className="small text-muted mb-3">Client : <strong>{selectedOrder.first_name} {selectedOrder.last_name}</strong> ({selectedOrder.email} / {selectedOrder.phone || 'Pas de numéro'})</p>
                        
                        <div className="table-responsive bg-white rounded-3 shadow-sm p-2 mb-3">
                          <table className="table align-middle table-sm small mb-0">
                            <thead>
                              <tr>
                                <th>Vos Articles</th>
                                <th className="text-center">Qté</th>
                                <th className="text-end">Prix total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedOrder.items?.map((item, idx) => (
                                <tr key={idx}>
                                  <td>{item.name}</td>
                                  <td className="text-center">{item.quantity}</td>
                                  <td className="text-end fw-semibold">{parseFloat(item.total_price).toLocaleString()} XOF</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    <div className="table-responsive">
                      <table className="table align-middle table-hover">
                        <thead>
                          <tr className="table-light">
                            <th>Numéro Commande</th>
                            <th>Date</th>
                            <th>Articles Concernés</th>
                            <th>Statut Global</th>
                            <th className="text-center">Détails</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.length === 0 ? (
                            <tr>
                              <td colSpan="5" className="text-center py-4 text-muted">Aucune commande contenant vos articles.</td>
                            </tr>
                          ) : orders.map(o => (
                            <tr key={o.id}>
                              <td className="fw-bold text-dark">#{o.order_number}</td>
                              <td className="text-muted small">{new Date(o.created_at).toLocaleDateString('fr-FR')}</td>
                              <td>{o.items?.map(it => `${it.name} (x${it.quantity})`).join(', ')}</td>
                              <td>
                                <span className={`badge px-3 py-1.5 rounded-pill text-capitalize bg-${
                                  o.status === 'confirmed' || o.status === 'delivered' ? 'success' :
                                  o.status === 'pending' ? 'warning' : 'danger'
                                }`}>
                                  {o.status === 'pending' ? 'En attente' :
                                   o.status === 'confirmed' ? 'Confirmé' :
                                   o.status === 'delivered' ? 'Livré' :
                                   o.status === 'cancelled' ? 'Annulé' : o.status}
                                </span>
                              </td>
                              <td className="text-center">
                                <button className="btn btn-sm btn-outline-primary border-0 rounded-circle p-2" onClick={() => setSelectedOrder(o)}>
                                  <FiEye size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 4. PROFIL PRO */}
                {activeTab === 'profile' && (
                  <div>
                    <h3 className="fw-bold mb-4 text-dark border-bottom pb-2">Profil Professionnel</h3>
                    <form onSubmit={handleProfileSubmit} className="border p-4 rounded-4 shadow-sm bg-light">
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label text-secondary fw-semibold">Nom du Contact Pro</label>
                          <input type="text" className="form-control rounded-3" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} required />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label text-secondary fw-semibold">Nom de l'entreprise (Raison sociale)</label>
                          <input type="text" className="form-control rounded-3" value={profile.company_name} onChange={(e) => setProfile({ ...profile, company_name: e.target.value })} required />
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label text-secondary fw-semibold">Email Professionnel</label>
                          <input type="email" className="form-control rounded-3" value={profile.email} disabled />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label text-secondary fw-semibold">Téléphone de l'entreprise</label>
                          <input type="tel" className="form-control rounded-3" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} required />
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label text-secondary fw-semibold">Numéro Fiscal (NINEA)</label>
                          <input type="text" className="form-control rounded-3" value={profile.tax_number} disabled />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label text-secondary fw-semibold">Adresse Pro</label>
                          <input type="text" className="form-control rounded-3" value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} />
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label text-secondary fw-semibold">Ville</label>
                          <input type="text" className="form-control rounded-3" value={profile.city} onChange={(e) => setProfile({ ...profile, city: e.target.value })} />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label text-secondary fw-semibold">Pays</label>
                          <input type="text" className="form-control rounded-3" value={profile.country} onChange={(e) => setProfile({ ...profile, country: e.target.value })} />
                        </div>
                      </div>

                      <div className="mt-4">
                        <button type="submit" className="btn btn-success rounded-pill px-4 fw-bold">Mettre à jour les informations</button>
                      </div>
                    </form>
                  </div>
                )}

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SupplierPage;
