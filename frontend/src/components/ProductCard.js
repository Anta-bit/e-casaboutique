import React, { useState } from 'react';
import { useCartStore } from '../store';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import './ProductCard.css';

function ProductCard({ product }) {
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore(state => state.addItem);

  const handleAddToCart = () => {
    addItem(product, quantity);
    toast.success(`${product.name} ajouté au panier!`);
  };

  const hasDiscount = product.discount_percent && parseFloat(product.discount_percent) > 0;
  const isOutOfStock = product.stock === 0;

  return (
    <div className="card product-card h-100 border-0 shadow-sm rounded-4 overflow-hidden position-relative">
      <div className="product-image-container bg-light d-flex align-items-center justify-content-center position-relative">
        <img
          src={product.image_url || 'https://via.placeholder.com/250x200?text=Produit'}
          alt={product.name}
          className="product-img"
        />
        {hasDiscount && (
          <span className="badge bg-danger position-absolute top-3 start-3 px-2 py-1 fs-7 fw-bold rounded-pill shadow-sm">
            -{Math.round(product.discount_percent)}%
          </span>
        )}
      </div>

      <div className="card-body d-flex flex-column p-4">
        {/* Catégorie */}
        <p className="text-muted text-uppercase fw-semibold fs-7 mb-2 tracking-wider">
          {product.category_name || 'Boutique'}
        </p>

        {/* Nom */}
        <h5 className="card-title fw-bold fs-6 mb-2">
          <Link to={`/product/${product.id}`} className="text-dark text-decoration-none hover-primary">
            {product.name}
          </Link>
        </h5>

        {/* Description courte */}
        <p className="card-text text-muted fs-7 mb-3 flex-grow-1">
          {product.description ? (product.description.substring(0, 60) + '...') : 'Pas de description.'}
        </p>

        {/* Évaluation */}
        <div className="mb-3">
          <div className="text-warning fs-7 fw-medium d-flex align-items-center gap-1">
            ⭐ {product.rating ? parseFloat(product.rating).toFixed(1) : '4.5'}
            <span className="text-muted fw-normal">({product.reviews || 0} avis)</span>
          </div>
        </div>

        {/* Prix */}
        <div className="price-section d-flex align-items-baseline gap-2 mb-3">
          <h4 className="fw-extrabold text-primary mb-0">
            {parseFloat(product.price).toLocaleString('fr-FR')} XOF
          </h4>
          {product.original_price && parseFloat(product.original_price) > parseFloat(product.price) && (
            <span className="text-muted text-decoration-line-through fs-7">
              {parseFloat(product.original_price).toLocaleString('fr-FR')} XOF
            </span>
          )}
        </div>

        {/* Quantité */}
        <div className="d-flex align-items-center justify-content-between mb-3 bg-light rounded-3 p-1">
          <button
            className="btn btn-sm btn-link text-secondary text-decoration-none fw-bold px-3 py-1 border-0"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={isOutOfStock}
          >
            -
          </button>
          <span className="fw-bold fs-6 text-dark px-2">{quantity}</span>
          <button
            className="btn btn-sm btn-link text-secondary text-decoration-none fw-bold px-3 py-1 border-0"
            onClick={() => setQuantity(quantity + 1)}
            disabled={isOutOfStock}
          >
            +
          </button>
        </div>

        {/* Bouton Ajouter au panier */}
        <button
          className="btn btn-primary btn-add-to-cart w-100 rounded-3 py-2 fw-semibold transition-all shadow-sm"
          onClick={handleAddToCart}
          disabled={isOutOfStock}
        >
          {!isOutOfStock ? 'Ajouter au panier' : 'Rupture de stock'}
        </button>

        {/* Stock */}
        <div className="text-center mt-3 fs-7">
          {!isOutOfStock ? (
            <span className="text-success fw-medium">✓ En stock ({product.stock})</span>
          ) : (
            <span className="text-danger fw-medium">✗ Rupture de stock</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
