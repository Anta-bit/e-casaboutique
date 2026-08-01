import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore, useAuthStore } from '../store';
import { FiShoppingCart, FiMenu, FiX, FiSearch, FiMic } from 'react-icons/fi';
import './Navbar.css';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const cartCount = useCartStore(state => state.getItemCount());
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/boutique?search=${searchQuery}`);
      setSearchQuery('');
    }
  };

  // Système vocal (Web Speech API)
  const handleVoiceSearch = () => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'fr-FR';
    recognition.start();

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      navigate(`/boutique?search=${transcript}`);
    };
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light shadow-sm">
      <div className="container-fluid">
        <Link className="navbar-brand fw-bold" to="/">
          🏠 Casa Boutique
        </Link>

        <button
          className="navbar-toggler"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>

        <div className={`collapse navbar-collapse ${isOpen ? 'show' : ''}`}>
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/">Accueil</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/boutique">Boutique</Link>
            </li>
            {user?.role === 'admin' && (
              <li className="nav-item">
                <Link className="nav-link text-danger" to="/admin">Admin</Link>
              </li>
            )}
          </ul>

          {/* Barre de recherche */}
          <form className="d-flex ms-3 me-3" onSubmit={handleSearch}>
            <input
              className="form-control me-2"
              type="search"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="btn btn-outline-primary" type="submit">
              <FiSearch />
            </button>
            <button
              className="btn btn-outline-secondary ms-2"
              type="button"
              onClick={handleVoiceSearch}
              title="Recherche vocale"
            >
              <FiMic />
            </button>
          </form>

          {/* Panier */}
          <Link to="/cart" className="btn btn-primary position-relative ms-2">
            <FiShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Auth */}
          <div className="ms-2">
            {user ? (
              <div className="dropdown">
                <button
                  className="btn btn-outline-secondary dropdown-toggle"
                  type="button"
                  id="userMenu"
                  data-bs-toggle="dropdown"
                >
                  {user.first_name ? `${user.first_name} ${user.last_name || ''}` : (user.nom || 'Compte')}
                </button>
                <ul className="dropdown-menu" aria-labelledby="userMenu">
                  <li><Link className="dropdown-item" to="/profile">Mon profil</Link></li>
                  {user?.role === 'admin' && (
                    <li><Link className="dropdown-item fw-bold text-danger" to="/admin">Espace Admin</Link></li>
                  )}
                  {user?.role === 'supplier' && (
                    <li><Link className="dropdown-item fw-bold text-primary" to="/supplier">Espace Fournisseur</Link></li>
                  )}
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button
                      className="dropdown-item"
                      onClick={() => {
                        logout();
                        navigate('/');
                      }}
                    >
                      Déconnexion
                    </button>
                  </li>
                </ul>
              </div>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline-primary ms-2">Connexion</Link>
                <Link to="/register" className="btn btn-primary ms-2">Inscription</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

