import React from 'react';
import { Link } from 'react-router-dom';
import { FiFacebook, FiTwitter, FiInstagram, FiLinkedin } from 'react-icons/fi';
import './Footer.css';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-dark text-light mt-5 pt-5">
      <div className="container">
        <div className="row mb-4">
          {/* À propos */}
          <div className="col-md-3">
            <h5>🏠 Casa Boutique</h5>
            <p>Votre plateforme e-commerce de confiance pour tous vos achats en ligne.</p>
            <div className="social-links">
              <a href="https://facebook.com" rel="noopener noreferrer" target="_blank" className="me-3"><FiFacebook size={20} /></a>
              <a href="https://twitter.com" rel="noopener noreferrer" target="_blank" className="me-3"><FiTwitter size={20} /></a>
              <a href="https://instagram.com" rel="noopener noreferrer" target="_blank" className="me-3"><FiInstagram size={20} /></a>
              <a href="https://linkedin.com" rel="noopener noreferrer" target="_blank"><FiLinkedin size={20} /></a>
            </div>
          </div>

          {/* Liens utiles */}
          <div className="col-md-3">
            <h5>Liens utiles</h5>
            <ul className="list-unstyled">
              <li><Link to="/boutique">Boutique</Link></li>
              <li><Link to="/">Accueil</Link></li>
              <li><Link to="/profile">Mon compte</Link></li>
              <li><Link to="/contact">Contact</Link></li>
            </ul>
          </div>

          {/* Service client */}
          <div className="col-md-3">
            <h5>Service client</h5>
            <ul className="list-unstyled">
              <li><button className="btn-link-footer">FAQ</button></li>
              <li><button className="btn-link-footer">Livraison</button></li>
              <li><button className="btn-link-footer">Retours</button></li>
              <li><button className="btn-link-footer">Support</button></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="col-md-3">
            <h5>Contact</h5>
            <p>
              📧 Email: contact@casaboutique.com<br />
              📞 Tél: +221 77 123 45 67<br />
              📍 Dakar, Sénégal
            </p>
          </div>
        </div>

        <hr className="border-secondary" />

        {/* Copyright */}
        <div className="row">
          <div className="col-md-6">
            <p>&copy; {currentYear} Casa Boutique. Tous droits réservés.</p>
          </div>
          <div className="col-md-6 text-end">
            <Link to="/" className="me-3">Politique de confidentialité</Link>
            <Link to="/" className="me-3">Conditions d'utilisation</Link>
            <Link to="/">Plan du site</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

