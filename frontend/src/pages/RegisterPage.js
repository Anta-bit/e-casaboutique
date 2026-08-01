import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';
import { useAuthStore } from '../store';
import toast from 'react-hot-toast';
import './AuthPages.css';

function RegisterPage() {
  const navigate = useNavigate();
  const setUser = useAuthStore(state => state.setUser);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    passwordConfirm: '',
    role: 'client', // client or supplier
    company_name: '',
    tax_number: '',
    address: '',
    city: '',
    country: 'Senegal'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.passwordConfirm) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.register({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: formData.role,
        company_name: formData.company_name,
        tax_number: formData.tax_number,
        address: formData.address,
        city: formData.city,
        country: formData.country
      });

      if (formData.role === 'supplier') {
        toast.success(response.data.message || 'Compte fournisseur en attente de validation.');
        navigate('/login');
      } else {
        setUser(response.data.user, response.data.token);
        toast.success('Inscription réussie!');
        navigate('/');
      }
    } catch (error) {
      console.error('Erreur inscription:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-6 col-md-8">
            <div className="card p-5 border-0 shadow rounded-4 bg-white">
              <h2 className="text-center fw-extrabold text-dark mb-4">Créer un compte</h2>

              {/* Toggle Client / Fournisseur */}
              <div className="mb-4 text-center">
                <label className="form-label text-secondary fw-bold d-block mb-3">Type de compte</label>
                <div className="btn-group w-100" role="group">
                  <button
                    type="button"
                    className={`btn ${formData.role === 'client' ? 'btn-primary' : 'btn-outline-primary'} w-50 rounded-start-pill`}
                    onClick={() => setFormData(prev => ({ ...prev, role: 'client' }))}
                  >
                    Client
                  </button>
                  <button
                    type="button"
                    className={`btn ${formData.role === 'supplier' ? 'btn-primary' : 'btn-outline-primary'} w-50 rounded-end-pill`}
                    onClick={() => setFormData(prev => ({ ...prev, role: 'supplier' }))}
                  >
                    Fournisseur
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label text-secondary fw-semibold">Prénom *</label>
                    <input
                      type="text"
                      className="form-control rounded-3"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label text-secondary fw-semibold">Nom *</label>
                    <input
                      type="text"
                      className="form-control rounded-3"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label text-secondary fw-semibold">Email *</label>
                  <input
                    type="email"
                    className="form-control rounded-3"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label text-secondary fw-semibold">Téléphone *</label>
                  <input
                    type="tel"
                    className="form-control rounded-3"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Ex: +221 77 123 45 67"
                    required
                  />
                </div>

                {/* Champs Fournisseur supplémentaires */}
                {formData.role === 'supplier' && (
                  <div className="border p-3 rounded-4 bg-light mb-4 shadow-sm">
                    <h5 className="fw-bold text-primary mb-3">Informations professionnelles</h5>
                    
                    <div className="mb-3">
                      <label className="form-label text-secondary fw-semibold">Nom de l'entreprise *</label>
                      <input
                        type="text"
                        className="form-control rounded-3"
                        name="company_name"
                        value={formData.company_name}
                        onChange={handleInputChange}
                        required={formData.role === 'supplier'}
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label text-secondary fw-semibold">Numéro NINEA / Numéro Fiscal *</label>
                      <input
                        type="text"
                        className="form-control rounded-3"
                        name="tax_number"
                        value={formData.tax_number}
                        onChange={handleInputChange}
                        placeholder="Ex: 1234567 2G3"
                        required={formData.role === 'supplier'}
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label text-secondary fw-semibold">Adresse pro *</label>
                      <input
                        type="text"
                        className="form-control rounded-3"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        required={formData.role === 'supplier'}
                      />
                    </div>

                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label text-secondary fw-semibold">Ville *</label>
                        <input
                          type="text"
                          className="form-control rounded-3"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          required={formData.role === 'supplier'}
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label text-secondary fw-semibold">Pays *</label>
                        <input
                          type="text"
                          className="form-control rounded-3"
                          name="country"
                          value={formData.country}
                          onChange={handleInputChange}
                          required={formData.role === 'supplier'}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label text-secondary fw-semibold">Mot de passe *</label>
                  <input
                    type="password"
                    className="form-control rounded-3"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label text-secondary fw-semibold">Confirmer le mot de passe *</label>
                  <input
                    type="password"
                    className="form-control rounded-3"
                    name="passwordConfirm"
                    value={formData.passwordConfirm}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 rounded-pill py-2.5 fw-bold shadow-sm transition-all"
                  disabled={loading}
                >
                  {loading ? 'Inscription...' : "S'inscrire"}
                </button>
              </form>

              <p className="text-center mt-4 mb-0 text-muted">
                Déjà inscrit? <Link to="/login" className="text-primary fw-bold text-decoration-none hover-underline">Se connecter</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
