import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { 
  productService, 
  orderService, 
  clientService, 
  statsService, 
  categoryService, 
  supplierService,
  paymentService,
  aiService
} from '../services/api';
import toast from 'react-hot-toast';
import { 
  FiSettings, FiBox, FiShoppingCart, FiUsers, FiBarChart2, 
  FiLayers, FiTruck, FiDollarSign, FiPlus, FiTrash2, FiEdit, FiEye,
  FiPrinter, FiCpu, FiClock, FiActivity
} from 'react-icons/fi';
import './AdminPage.css';

function AdminPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Data lists
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [payments, setPayments] = useState([]);
  
  // Nouveaux états
  const [allUsers, setAllUsers] = useState([]);
  const [pendingSuppliers, setPendingSuppliers] = useState([]);
  const [testMessage, setTestMessage] = useState('');
  const [aiTestResponse, setAiTestResponse] = useState('');
  const [testingAi, setTestingAi] = useState(false);
  
  // Stats
  const [stats, setStats] = useState({});
  const [salesData, setSalesData] = useState([]);
  const [revenueByCategory, setRevenueByCategory] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  const [loading, setLoading] = useState(true);

  // Form states
  const [productForm, setProductForm] = useState({
    id: null, name: '', description: '', price: '', original_price: '', 
    category_id: '', supplier_id: '', stock: '', image_url: '', discount_percent: ''
  });
  const [categoryForm, setCategoryForm] = useState({ id: null, name: '', description: '', image_url: '' });
  const [supplierForm, setSupplierForm] = useState({
    id: null, name: '', email: '', phone: '', company_name: '', tax_number: '', 
    address: '', city: '', country: 'Senegal'
  });

  const [showProductForm, setShowProductForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showSupplierForm, setShowSupplierForm] = useState(false);

  // Modal detail states
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
    } else {
      loadAllData();
    }
  }, [user, navigate]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [
        prodRes, catRes, suppRes, ordRes, clientRes, payRes, 
        statsRes, salesRes, revCatRes, topProdRes,
        usersRes, pendingSuppRes
      ] = await Promise.all([
        productService.getAll(),
        categoryService.getAll(),
        supplierService.getAll(),
        orderService.getAllAdmin(),
        clientService.getAll(),
        paymentService.getPayments(),
        statsService.getDashboard(),
        statsService.getSalesByDay(),
        statsService.getRevenueByCategory(),
        statsService.getTopProducts(),
        clientService.getAdminUsers(),
        clientService.getPendingSuppliers()
      ]);

      setProducts(prodRes.data || []);
      setCategories(catRes.data || []);
      setSuppliers(suppRes.data || []);
      setOrders(ordRes.data || []);
      setClients(clientRes.data || []);
      setPayments(payRes.data || []);
      
      setStats(statsRes.data || {});
      setSalesData(salesRes.data || []);
      setRevenueByCategory(revCatRes.data || []);
      setTopProducts(topProdRes.data || []);

      setAllUsers(usersRes.data || []);
      setPendingSuppliers(pendingSuppRes.data || []);

    } catch (error) {
      console.error('Erreur de chargement admin:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  // --- ACTIONS GESTION DES UTILISATEURS (CLIENTS/FOURNISSEURS) ---
  const handleToggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await clientService.updateUserStatus(userId, newStatus);
      toast.success(newStatus === 'active' ? 'Compte utilisateur réactivé !' : 'Compte utilisateur suspendu !');
      loadAllData();
    } catch (error) {
      toast.error('Erreur de mise à jour du statut');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Voulez-vous supprimer définitivement cet utilisateur ?')) {
      try {
        await clientService.deleteUser(userId);
        toast.success('Utilisateur supprimé !');
        loadAllData();
      } catch (error) {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  // --- ACTIONS VALIDATION INSCRIPTIONS FOURNISSEURS ---
  const handleValidateSupplier = async (supplierId, approvalStatus) => {
    try {
      await clientService.validateSupplier(supplierId, approvalStatus);
      toast.success(approvalStatus === 'approved' ? 'Profil fournisseur approuvé et activé !' : 'Inscription du fournisseur rejetée.');
      loadAllData();
    } catch (error) {
      toast.error('Erreur lors de la validation du fournisseur');
    }
  };

  // --- ACTION DIAGNOSTIC IA ---
  const handleTestAI = async (e) => {
    e.preventDefault();
    if (!testMessage.trim()) return;
    setTestingAi(true);
    setAiTestResponse('');
    try {
      const res = await aiService.chat([{ sender: 'user', content: testMessage }]);
      setAiTestResponse(JSON.stringify(res.data, null, 2));
    } catch (error) {
      setAiTestResponse("Erreur d'appel au service IA. Vérifiez que la clé GEMINI_API_KEY est bien configurée ou que le backend fonctionne.");
    } finally {
      setTestingAi(false);
    }
  };

  // --- CRUD PRODUITS ---
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      if (productForm.id) {
        await productService.update(productForm.id, productForm);
        toast.success('Produit modifié !');
      } else {
        await productService.create(productForm);
        toast.success('Produit créé !');
      }
      setShowProductForm(false);
      resetProductForm();
      loadAllData();
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
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
      supplier_id: prod.supplier_id || '',
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
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const resetProductForm = () => {
    setProductForm({
      id: null, name: '', description: '', price: '', original_price: '', 
      category_id: '', supplier_id: '', stock: '', image_url: '', discount_percent: ''
    });
  };

  // --- CRUD CATEGORIES ---
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      if (categoryForm.id) {
        await categoryService.update(categoryForm.id, categoryForm);
        toast.success('Catégorie modifiée !');
      } else {
        await categoryService.create(categoryForm);
        toast.success('Catégorie créée !');
      }
      setShowCategoryForm(false);
      setCategoryForm({ id: null, name: '', description: '', image_url: '' });
      loadAllData();
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm('Voulez-vous supprimer cette catégorie ?')) {
      try {
        await categoryService.delete(id);
        toast.success('Catégorie supprimée');
        loadAllData();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
      }
    }
  };

  // --- CRUD FOURNISSEURS ---
  const handleSupplierSubmit = async (e) => {
    e.preventDefault();
    try {
      if (supplierForm.id) {
        await supplierService.update(supplierForm.id, supplierForm);
        toast.success('Fournisseur modifié !');
      } else {
        await supplierService.create(supplierForm);
        toast.success('Fournisseur créé !');
      }
      setShowSupplierForm(false);
      setSupplierForm({ id: null, name: '', email: '', phone: '', company_name: '', tax_number: '', address: '', city: '', country: 'Senegal' });
      loadAllData();
    } catch (error) {
      toast.error("Erreur d'enregistrement");
    }
  };

  const handleDeleteSupplier = async (id) => {
    if (window.confirm('Voulez-vous supprimer ce fournisseur ?')) {
      try {
        await supplierService.delete(id);
        toast.success('Fournisseur supprimé');
        loadAllData();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
      }
    }
  };

  // --- COMMANDES ---
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await orderService.updateStatus(orderId, newStatus);
      toast.success('Statut mis à jour');
      loadAllData();
    } catch (error) {
      toast.error('Erreur lors du changement de statut');
    }
  };

  const handleViewOrder = async (orderId) => {
    try {
      const res = await orderService.getById(orderId);
      setSelectedOrder(res.data);
    } catch (error) {
      toast.error('Erreur lors de la récupération des détails');
    }
  };

  // Calcul du max pour le graphique SVG
  const maxSales = Math.max(...salesData.map(s => parseFloat(s.total) || 0), 1000);

  return (
    <div className="admin-page py-5">
      <div className="container-fluid px-4">
        <h1 className="fw-extrabold text-dark mb-4 d-flex align-items-center gap-2">
          <FiSettings className="spin" /> Espace Administrateur
        </h1>

        <div className="row g-4">
          <div className="col-lg-2">
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white sidebar-nav p-2">
              <button className={`btn-sidebar ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
                <FiBarChart2 className="me-2" /> Dashboard
              </button>
              <button className={`btn-sidebar ${activeTab === 'validations' ? 'active' : ''}`} onClick={() => setActiveTab('validations')}>
                <FiClock className="me-2 text-warning animate-pulse" /> Validations
                {pendingSuppliers.length > 0 && (
                  <span className="badge bg-danger ms-auto rounded-pill">{pendingSuppliers.length}</span>
                )}
              </button>
              <button className={`btn-sidebar ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
                <FiUsers className="me-2" /> Utilisateurs
              </button>
              <button className={`btn-sidebar ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>
                <FiBox className="me-2" /> Produits
              </button>
              <button className={`btn-sidebar ${activeTab === 'categories' ? 'active' : ''}`} onClick={() => setActiveTab('categories')}>
                <FiLayers className="me-2" /> Catégories
              </button>
              <button className={`btn-sidebar ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
                <FiShoppingCart className="me-2" /> Commandes
              </button>
              <button className={`btn-sidebar ${activeTab === 'clients' ? 'active' : ''}`} onClick={() => setActiveTab('clients')}>
                <FiUsers className="me-2 text-secondary" /> Profils Clients
              </button>
              <button className={`btn-sidebar ${activeTab === 'suppliers' ? 'active' : ''}`} onClick={() => setActiveTab('suppliers')}>
                <FiTruck className="me-2" /> Fournisseurs
              </button>
              <button className={`btn-sidebar ${activeTab === 'payments' ? 'active' : ''}`} onClick={() => setActiveTab('payments')}>
                <FiDollarSign className="me-2" /> Paiements
              </button>
              <button className={`btn-sidebar ${activeTab === 'ai_services' ? 'active' : ''}`} onClick={() => setActiveTab('ai_services')}>
                <FiCpu className="me-2" /> Services IA
              </button>
            </div>
          </div>
 
          {/* Zone de Contenu */}
          <div className="col-lg-10">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Chargement...</span>
                </div>
              </div>
            ) : (
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                
                {/* 1. DASHBOARD */}
                {activeTab === 'dashboard' && (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
                      <h3 className="fw-bold mb-0 text-dark">Tableau de Bord</h3>
                      <button className="btn btn-outline-secondary rounded-pill px-3 fw-bold d-flex align-items-center gap-1 hide-on-print" onClick={() => window.print()}>
                        <FiPrinter /> Exporter le Rapport (PDF)
                      </button>
                    </div>
                    
                    {/* KPI Cards */}
                    <div className="row g-4 mb-4">
                      <div className="col-md-3">
                        <div className="kpi-card bg-primary-subtle text-primary p-4 rounded-4 d-flex align-items-center justify-content-between">
                          <div>
                            <h6 className="text-uppercase fw-bold text-secondary mb-1">Ventes</h6>
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
                            <h6 className="text-uppercase fw-bold text-secondary mb-1">Clients</h6>
                            <h3 className="fw-extrabold mb-0">{stats.clients || 0}</h3>
                          </div>
                          <FiUsers size={40} />
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="kpi-card bg-warning-subtle text-warning p-4 rounded-4 d-flex align-items-center justify-content-between">
                          <div>
                            <h6 className="text-uppercase fw-bold text-secondary mb-1">Produits</h6>
                            <h3 className="fw-extrabold mb-0">{stats.products || 0}</h3>
                          </div>
                          <FiBox size={40} />
                        </div>
                      </div>
                    </div>

                    <div className="row g-4 mt-2">
                      {/* Graphique SVG des ventes */}
                      <div className="col-lg-8">
                        <div className="card border p-4 rounded-4 h-100 shadow-sm bg-white">
                          <h5 className="fw-bold mb-4 text-dark">Évolution des Ventes (30 derniers jours)</h5>
                          {salesData.length === 0 ? (
                            <div className="text-center py-5 text-muted">Aucune donnée de vente récente</div>
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

                      {/* Revenus par Catégorie */}
                      <div className="col-lg-4">
                        <div className="card border p-4 rounded-4 h-100 shadow-sm bg-white">
                          <h5 className="fw-bold mb-4 text-dark">Répartition par Catégorie</h5>
                          {revenueByCategory.length === 0 ? (
                            <div className="text-center py-5 text-muted">Aucun revenu disponible</div>
                          ) : (
                            <div className="d-flex flex-column gap-3">
                              {revenueByCategory.slice(0, 5).map((item, index) => (
                                <div key={index}>
                                  <div className="d-flex justify-content-between small fw-bold text-dark mb-1">
                                    <span>{item.name}</span>
                                    <span>{parseFloat(item.revenue).toLocaleString()} XOF</span>
                                  </div>
                                  <div className="progress rounded-pill" style={{ height: '8px' }}>
                                    <div 
                                      className="progress-bar rounded-pill bg-success" 
                                      style={{ width: `${Math.min(100, (parseFloat(item.revenue) / (stats.totalSales || 1)) * 100)}%` }}
                                    ></div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="row g-4 mt-3">
                      <div className="col-12">
                        <div className="card border p-4 rounded-4 shadow-sm bg-white">
                          <h5 className="fw-bold mb-3 text-dark">Top 5 Produits les Plus Vendus</h5>
                          {topProducts.length === 0 ? (
                            <div className="text-center py-3 text-muted">Aucune vente de produit enregistrée</div>
                          ) : (
                            <div className="table-responsive">
                              <table className="table table-sm align-middle mb-0">
                                <thead>
                                  <tr className="table-light">
                                    <th>Nom</th>
                                    <th className="text-center">Quantité vendue</th>
                                    <th className="text-end">Revenu généré</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {topProducts.slice(0, 5).map((p, idx) => (
                                    <tr key={idx}>
                                      <td className="fw-bold text-dark">{p.name}</td>
                                      <td className="text-center">{p.total_sold}</td>
                                      <td className="text-end fw-semibold text-success">{parseFloat(p.revenue).toLocaleString()} XOF</td>
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
                )}

                {/* 2. PRODUITS */}
                {activeTab === 'products' && (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
                      <h3 className="fw-bold mb-0 text-dark">Gestion des Produits</h3>
                      {!showProductForm && (
                        <button className="btn btn-primary rounded-pill d-flex align-items-center gap-2" onClick={() => { resetProductForm(); setShowProductForm(true); }}>
                          <FiPlus /> Ajouter un produit
                        </button>
                      )}
                    </div>

                    {showProductForm ? (
                      <form onSubmit={handleProductSubmit} className="border p-4 rounded-4 shadow-sm bg-light">
                        <h5 className="fw-bold mb-4 text-dark">{productForm.id ? 'Modifier le produit' : 'Nouveau produit'}</h5>
                        <div className="row">
                          <div className="col-md-6 mb-3">
                            <label className="form-label text-secondary fw-semibold">Nom du produit</label>
                            <input type="text" className="form-control rounded-3" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} required />
                          </div>
                          <div className="col-md-6 mb-3">
                            <label className="form-label text-secondary fw-semibold">Catégorie</label>
                            <select className="form-select rounded-3" value={productForm.category_id} onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })} required>
                              <option value="">Sélectionner...</option>
                              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                          </div>
                        </div>

                        <div className="row">
                          <div className="col-md-4 mb-3">
                            <label className="form-label text-secondary fw-semibold">Prix (XOF)</label>
                            <input type="number" className="form-control rounded-3" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} required />
                          </div>
                          <div className="col-md-4 mb-3">
                            <label className="form-label text-secondary fw-semibold">Prix original (XOF)</label>
                            <input type="number" className="form-control rounded-3" value={productForm.original_price} onChange={(e) => setProductForm({ ...productForm, original_price: e.target.value })} />
                          </div>
                          <div className="col-md-4 mb-3">
                            <label className="form-label text-secondary fw-semibold">Stock initial</label>
                            <input type="number" className="form-control rounded-3" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} required />
                          </div>
                        </div>

                        <div className="row">
                          <div className="col-md-6 mb-3">
                            <label className="form-label text-secondary fw-semibold">URL de l'image</label>
                            <input type="text" className="form-control rounded-3" value={productForm.image_url} onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })} placeholder="Ex: https://..." />
                          </div>
                          <div className="col-md-3 mb-3">
                            <label className="form-label text-secondary fw-semibold">Fournisseur</label>
                            <select className="form-select rounded-3" value={productForm.supplier_id} onChange={(e) => setProductForm({ ...productForm, supplier_id: e.target.value })}>
                              <option value="">Sélectionner...</option>
                              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.company_name})</option>)}
                            </select>
                          </div>
                          <div className="col-md-3 mb-3">
                            <label className="form-label text-secondary fw-semibold">Pourcentage de réduction (%)</label>
                            <input type="number" className="form-control rounded-3" value={productForm.discount_percent} onChange={(e) => setProductForm({ ...productForm, discount_percent: e.target.value })} />
                          </div>
                        </div>

                        <div className="mb-4">
                          <label className="form-label text-secondary fw-semibold">Description</label>
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
                              <th>Fournisseur</th>
                              <th className="text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {products.map(p => (
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
                                <td>{p.supplier_name || 'Aucun'}</td>
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

                {/* 3. CATEGORIES */}
                {activeTab === 'categories' && (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
                      <h3 className="fw-bold mb-0 text-dark">Gestion des Catégories</h3>
                      {!showCategoryForm && (
                        <button className="btn btn-primary rounded-pill d-flex align-items-center gap-2" onClick={() => { setCategoryForm({ id: null, name: '', description: '', image_url: '' }); setShowCategoryForm(true); }}>
                          <FiPlus /> Ajouter une catégorie
                        </button>
                      )}
                    </div>

                    {showCategoryForm ? (
                      <form onSubmit={handleCategorySubmit} className="border p-4 rounded-4 shadow-sm bg-light">
                        <h5 className="fw-bold mb-4 text-dark">{categoryForm.id ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</h5>
                        <div className="mb-3">
                          <label className="form-label text-secondary fw-semibold">Nom de la catégorie</label>
                          <input type="text" className="form-control rounded-3" value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} required />
                        </div>
                        <div className="mb-3">
                          <label className="form-label text-secondary fw-semibold">URL de l'image de couverture</label>
                          <input type="text" className="form-control rounded-3" value={categoryForm.image_url} onChange={(e) => setCategoryForm({ ...categoryForm, image_url: e.target.value })} placeholder="Ex: https://..." />
                        </div>
                        <div className="mb-4">
                          <label className="form-label text-secondary fw-semibold">Description</label>
                          <textarea className="form-control rounded-3" rows="3" value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}></textarea>
                        </div>
                        <div className="d-flex gap-2">
                          <button type="submit" className="btn btn-success rounded-pill px-4 fw-bold">Enregistrer</button>
                          <button type="button" className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setShowCategoryForm(false)}>Annuler</button>
                        </div>
                      </form>
                    ) : (
                      <div className="table-responsive">
                        <table className="table align-middle table-hover">
                          <thead>
                            <tr className="table-light">
                              <th>ID</th>
                              <th>Nom</th>
                              <th>Description</th>
                              <th className="text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {categories.map(c => (
                              <tr key={c.id}>
                                <td>#{c.id}</td>
                                <td className="fw-bold text-dark">{c.name}</td>
                                <td className="text-muted small">{c.description || 'Pas de description'}</td>
                                <td className="text-center">
                                  <button className="btn btn-sm btn-outline-warning border-0 rounded-circle p-2 me-2" onClick={() => { setCategoryForm({ id: c.id, name: c.name, description: c.description || '', image_url: c.image_url || '' }); setShowCategoryForm(true); }}>
                                    <FiEdit size={16} />
                                  </button>
                                  <button className="btn btn-sm btn-outline-danger border-0 rounded-circle p-2" onClick={() => handleDeleteCategory(c.id)}>
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

                {/* 4. COMMANDES */}
                {activeTab === 'orders' && (
                  <div>
                    <h3 className="fw-bold mb-4 text-dark border-bottom pb-2">Gestion des Commandes</h3>
                    
                    {selectedOrder && (
                      <div className="border border-primary p-4 rounded-4 shadow-sm bg-primary-subtle mb-4">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h5 className="fw-bold mb-0 text-primary">Détails Commande #{selectedOrder.order_number}</h5>
                          <button className="btn btn-close" onClick={() => setSelectedOrder(null)}></button>
                        </div>
                        <p className="small text-muted mb-2">Statut Actuel : <span className="fw-bold text-capitalize">{selectedOrder.status}</span></p>
                        <p className="small text-muted mb-3">Adresse de livraison : {selectedOrder.shipping_address}, {selectedOrder.shipping_city}, {selectedOrder.shipping_country}</p>
                        
                        <div className="table-responsive bg-white rounded-3 shadow-sm p-2 mb-3">
                          <table className="table align-middle table-sm small mb-0">
                            <thead>
                              <tr>
                                <th>Produit</th>
                                <th className="text-center">Qté</th>
                                <th className="text-end">Prix</th>
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
                            <th>Numéro</th>
                            <th>Client</th>
                            <th>Date</th>
                            <th>Montant</th>
                            <th>Statut</th>
                            <th className="text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.map(o => (
                            <tr key={o.id}>
                              <td className="fw-bold text-dark">#{o.order_number}</td>
                              <td>
                                <div className="fw-semibold">{o.first_name} {o.last_name}</div>
                                <div className="small text-muted">{o.email}</div>
                              </td>
                              <td className="text-muted small">{new Date(o.created_at).toLocaleDateString('fr-FR')}</td>
                              <td className="fw-bold text-dark">{parseFloat(o.total_amount).toLocaleString()} XOF</td>
                              <td>
                                <select 
                                  className={`form-select form-select-sm rounded-pill text-capitalize text-center fw-bold bg-opacity-10 border-0 ${
                                    o.status === 'confirmed' || o.status === 'delivered' ? 'bg-success text-success' :
                                    o.status === 'pending' ? 'bg-warning text-warning' : 'bg-danger text-danger'
                                  }`}
                                  value={o.status}
                                  onChange={(e) => handleStatusChange(o.id, e.target.value)}
                                >
                                  <option value="pending">En attente</option>
                                  <option value="confirmed">Confirmé</option>
                                  <option value="shipped">Expédié</option>
                                  <option value="delivered">Livré</option>
                                  <option value="cancelled">Annulé</option>
                                </select>
                              </td>
                              <td className="text-center">
                                <button className="btn btn-sm btn-outline-primary border-0 rounded-circle p-2" onClick={() => handleViewOrder(o.id)}>
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

                {/* 5. CLIENTS */}
                {activeTab === 'clients' && (
                  <div>
                    <h3 className="fw-bold mb-4 text-dark border-bottom pb-2">Liste des Clients</h3>
                    <div className="table-responsive">
                      <table className="table align-middle table-hover">
                        <thead>
                          <tr className="table-light">
                            <th>Client</th>
                            <th>Email</th>
                            <th>Téléphone</th>
                            <th>Adresse</th>
                            <th>Inscription</th>
                          </tr>
                        </thead>
                        <tbody>
                          {clients.map(c => (
                            <tr key={c.id}>
                              <td className="fw-bold text-dark">{c.first_name} {c.last_name}</td>
                              <td>{c.email}</td>
                              <td className="text-muted">{c.phone || 'Non renseigné'}</td>
                              <td className="text-muted small">{c.city ? `${c.city}, ${c.country}` : 'Non spécifié'}</td>
                              <td className="text-muted small">{new Date(c.created_at).toLocaleDateString('fr-FR')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 6. FOURNISSEURS */}
                {activeTab === 'suppliers' && (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
                      <h3 className="fw-bold mb-0 text-dark">Gestion des Fournisseurs</h3>
                      {!showSupplierForm && (
                        <button className="btn btn-primary rounded-pill d-flex align-items-center gap-2" onClick={() => { setSupplierForm({ id: null, name: '', email: '', phone: '', company_name: '', tax_number: '', address: '', city: '', country: 'Senegal' }); setShowSupplierForm(true); }}>
                          <FiPlus /> Ajouter un fournisseur
                        </button>
                      )}
                    </div>

                    {showSupplierForm ? (
                      <form onSubmit={handleSupplierSubmit} className="border p-4 rounded-4 shadow-sm bg-light">
                        <h5 className="fw-bold mb-4 text-dark">{supplierForm.id ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}</h5>
                        <div className="row">
                          <div className="col-md-6 mb-3">
                            <label className="form-label text-secondary fw-semibold">Nom du contact</label>
                            <input type="text" className="form-control rounded-3" value={supplierForm.name} onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })} required />
                          </div>
                          <div className="col-md-6 mb-3">
                            <label className="form-label text-secondary fw-semibold">Entreprise</label>
                            <input type="text" className="form-control rounded-3" value={supplierForm.company_name} onChange={(e) => setSupplierForm({ ...supplierForm, company_name: e.target.value })} required />
                          </div>
                        </div>

                        <div className="row">
                          <div className="col-md-6 mb-3">
                            <label className="form-label text-secondary fw-semibold">Email</label>
                            <input type="email" className="form-control rounded-3" value={supplierForm.email} onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })} required />
                          </div>
                          <div className="col-md-6 mb-3">
                            <label className="form-label text-secondary fw-semibold">Téléphone</label>
                            <input type="tel" className="form-control rounded-3" value={supplierForm.phone} onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })} required />
                          </div>
                        </div>

                        <div className="row">
                          <div className="col-md-6 mb-3">
                            <label className="form-label text-secondary fw-semibold">Numéro fiscal / NINEA</label>
                            <input type="text" className="form-control rounded-3" value={supplierForm.tax_number} onChange={(e) => setSupplierForm({ ...supplierForm, tax_number: e.target.value })} />
                          </div>
                          <div className="col-md-6 mb-3">
                            <label className="form-label text-secondary fw-semibold">Adresse</label>
                            <input type="text" className="form-control rounded-3" value={supplierForm.address} onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })} />
                          </div>
                        </div>

                        <div className="row">
                          <div className="col-md-6 mb-3">
                            <label className="form-label text-secondary fw-semibold">Ville</label>
                            <input type="text" className="form-control rounded-3" value={supplierForm.city} onChange={(e) => setSupplierForm({ ...supplierForm, city: e.target.value })} />
                          </div>
                          <div className="col-md-6 mb-3">
                            <label className="form-label text-secondary fw-semibold">Pays</label>
                            <input type="text" className="form-control rounded-3" value={supplierForm.country} onChange={(e) => setSupplierForm({ ...supplierForm, country: e.target.value })} />
                          </div>
                        </div>

                        <div className="d-flex gap-2">
                          <button type="submit" className="btn btn-success rounded-pill px-4 fw-bold">Enregistrer</button>
                          <button type="button" className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setShowSupplierForm(false)}>Annuler</button>
                        </div>
                      </form>
                    ) : (
                      <div className="table-responsive">
                        <table className="table align-middle table-hover">
                          <thead>
                            <tr className="table-light">
                              <th>Nom</th>
                              <th>Entreprise</th>
                              <th>Email</th>
                              <th>Téléphone</th>
                              <th>Numéro Fiscal</th>
                              <th className="text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {suppliers.map(s => (
                              <tr key={s.id}>
                                <td className="fw-bold text-dark">{s.name}</td>
                                <td>{s.company_name}</td>
                                <td>{s.email}</td>
                                <td>{s.phone}</td>
                                <td>{s.tax_number || 'Non renseigné'}</td>
                                <td className="text-center">
                                  <button className="btn btn-sm btn-outline-warning border-0 rounded-circle p-2 me-2" onClick={() => { setSupplierForm({ id: s.id, name: s.name, email: s.email, phone: s.phone, company_name: s.company_name, tax_number: s.tax_number || '', address: s.address || '', city: s.city || '', country: s.country || 'Senegal' }); setShowSupplierForm(true); }}>
                                    <FiEdit size={16} />
                                  </button>
                                  <button className="btn btn-sm btn-outline-danger border-0 rounded-circle p-2" onClick={() => handleDeleteSupplier(s.id)}>
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

                {/* 7. PAIEMENTS */}
                {activeTab === 'payments' && (
                  <div>
                    <h3 className="fw-bold mb-4 text-dark border-bottom pb-2">Historique des Paiements</h3>
                    <div className="table-responsive">
                      <table className="table align-middle table-hover">
                        <thead>
                          <tr className="table-light">
                            <th>Réf. Commande</th>
                            <th>ID Transaction</th>
                            <th>Montant</th>
                            <th>Mode de paiement</th>
                            <th>Statut</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payments.map(p => (
                            <tr key={p.id}>
                              <td className="fw-bold">Commande #{p.order_id}</td>
                              <td className="text-secondary small">{p.transaction_id || 'En attente'}</td>
                              <td className="fw-bold text-dark">{parseFloat(p.amount).toLocaleString()} XOF</td>
                              <td className="text-uppercase fw-semibold">{p.payment_method}</td>
                              <td>
                                <span className={`badge px-3 py-1.5 rounded-pill bg-${p.payment_status === 'completed' ? 'success' : p.payment_status === 'failed' ? 'danger' : 'warning'}`}>
                                  {p.payment_status}
                                </span>
                              </td>
                              <td className="text-muted small">{new Date(p.created_at).toLocaleDateString('fr-FR')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 8. VALIDATIONS INSCRIPTIONS FOURNISSEURS */}
                {activeTab === 'validations' && (
                  <div>
                    <h3 className="fw-bold mb-4 text-dark border-bottom pb-2">Validations Fournisseurs</h3>
                    {pendingSuppliers.length === 0 ? (
                      <div className="alert alert-info rounded-4 border-0 p-4 text-center">
                        Aucune demande d'inscription fournisseur en attente.
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <table className="table align-middle table-hover">
                          <thead>
                            <tr className="table-light">
                              <th>Nom</th>
                              <th>Entreprise</th>
                              <th>Email</th>
                              <th>NINEA</th>
                              <th>Téléphone</th>
                              <th className="text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pendingSuppliers.map(s => (
                              <tr key={s.id}>
                                <td className="fw-bold text-dark">{s.name}</td>
                                <td>{s.company_name}</td>
                                <td>{s.email}</td>
                                <td><code>{s.tax_number}</code></td>
                                <td>{s.phone}</td>
                                <td className="text-center">
                                  <button
                                    className="btn btn-sm btn-success rounded-pill px-3 fw-bold me-2"
                                    onClick={() => handleValidateSupplier(s.id, 'approved')}
                                  >
                                    Approuver
                                  </button>
                                  <button
                                    className="btn btn-sm btn-outline-danger rounded-pill px-3"
                                    onClick={() => handleValidateSupplier(s.id, 'rejected')}
                                  >
                                    Rejeter
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

                {/* 9. GESTION DES UTILISATEURS (CLIENTS & FOURNISSEURS) */}
                {activeTab === 'users' && (
                  <div>
                    <h3 className="fw-bold mb-4 text-dark border-bottom pb-2">Gestion des Utilisateurs</h3>
                    <div className="table-responsive">
                      <table className="table align-middle table-hover">
                        <thead>
                          <tr className="table-light">
                            <th>Nom complet</th>
                            <th>Email</th>
                            <th>Téléphone</th>
                            <th>Rôle</th>
                            <th>Statut</th>
                            <th className="text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allUsers.map(u => (
                            <tr key={u.id}>
                              <td className="fw-bold text-dark">{u.first_name} {u.last_name}</td>
                              <td>{u.email}</td>
                              <td>{u.phone || 'Non spécifié'}</td>
                              <td>
                                <span className={`badge px-2 py-1 bg-opacity-10 text-capitalize ${
                                  u.role === 'supplier' ? 'bg-primary text-primary' : 'bg-secondary text-secondary'
                                }`}>
                                  {u.role === 'supplier' ? 'Fournisseur' : 'Client'}
                                </span>
                              </td>
                              <td>
                                <span className={`badge px-3 py-1.5 rounded-pill text-capitalize bg-${u.status === 'active' ? 'success' : 'danger'}`}>
                                  {u.status === 'active' ? 'Actif' : 'Suspendu'}
                                </span>
                              </td>
                              <td className="text-center">
                                <button
                                  className={`btn btn-sm rounded-pill px-3 fw-bold me-2 ${
                                    u.status === 'active' ? 'btn-outline-warning' : 'btn-warning text-white'
                                  }`}
                                  onClick={() => handleToggleUserStatus(u.id, u.status)}
                                >
                                  {u.status === 'active' ? 'Suspendre' : 'Réactiver'}
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-danger border-0 rounded-circle p-2"
                                  onClick={() => handleDeleteUser(u.id)}
                                  title="Supprimer définitivement"
                                >
                                  <FiTrash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 10. DIAGNOSTIC SERVICES IA */}
                {activeTab === 'ai_services' && (
                  <div>
                    <h3 className="fw-bold mb-4 text-dark border-bottom pb-2 d-flex align-items-center gap-2">
                      <FiCpu /> Diagnostic Services IA (Gemini API)
                    </h3>
                    
                    <div className="row g-4">
                      {/* Statut service */}
                      <div className="col-md-4">
                        <div className="card border rounded-4 p-4 shadow-sm h-100 bg-light">
                          <h5 className="fw-bold mb-3 text-secondary d-flex align-items-center gap-2">
                            <FiActivity className="text-success" /> État du Système
                          </h5>
                          <div className="d-flex align-items-center gap-2 mb-3">
                            <span className="dot-blink bg-success"></span>
                            <span className="fw-bold text-success">API active (Gemini 2.5 Flash)</span>
                          </div>
                          <p className="small text-muted mb-0">
                            L'intégration vocale Wolof/Français et le guide Casa IA utilisent le SDK officiel de Google.
                          </p>
                        </div>
                      </div>
                      
                      {/* Test console */}
                      <div className="col-md-8">
                        <div className="card border rounded-4 p-4 shadow-sm h-100 bg-white">
                          <h5 className="fw-bold mb-3 text-dark">Console de Test Chatbot</h5>
                          <form onSubmit={handleTestAI} className="mb-4">
                            <div className="input-group">
                              <input
                                type="text"
                                className="form-control rounded-start-pill px-3"
                                placeholder="Posez une question à Casa IA (ex: Dama beug panier bi...)"
                                value={testMessage}
                                onChange={(e) => setTestMessage(e.target.value)}
                                disabled={testingAi}
                                required
                              />
                              <button type="submit" className="btn btn-primary rounded-end-pill px-4 fw-bold" disabled={testingAi}>
                                {testingAi ? 'Envoi...' : 'Tester'}
                              </button>
                            </div>
                          </form>
                          
                          {aiTestResponse && (
                            <div>
                              <h6 className="fw-bold text-secondary mb-2">Réponse brute du serveur JSON :</h6>
                              <pre className="bg-dark text-success p-3 rounded-3 font-monospace small overflow-auto" style={{ maxHeight: '180px' }}>
                                {aiTestResponse}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
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

export default AdminPage;
