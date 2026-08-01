import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productService, categoryService } from '../services/api';
import ProductCard from '../components/ProductCard';
import { Row, Col } from 'react-bootstrap';
import './BoutiquePage.css';

function BoutiquePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    priceMin: 0,
    priceMax: 1000000,
    search: searchParams.get('search') || '',
    sort: 'recent'
  });

  // Load products and categories
  const loadCategories = useCallback(async () => {
    try {
      const res = await categoryService.getAll();
      setCategories(res.data);
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const searchVal = searchParams.get('search') || '';
      const catVal = searchParams.get('category') || '';
      
      setFilters(prev => ({
        ...prev,
        search: searchVal,
        category: catVal
      }));

      // Call API with filters
      const res = await productService.getAll();
      setProducts(res.data);
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, [loadCategories, loadProducts]);

  const applyFilters = useCallback(() => {
    let filtered = [...products];
    
    // Filter by category
    if (filters.category) {
      filtered = filtered.filter(p => p.category_id === parseInt(filters.category));
    }
    
    // Filter by price range
    filtered = filtered.filter(p =>
      parseFloat(p.price) >= parseFloat(filters.priceMin) && 
      parseFloat(p.price) <= parseFloat(filters.priceMax)
    );
    
    // Filter by search text
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchLower) ||
        (p.description && p.description.toLowerCase().includes(searchLower))
      );
    }
    
    // Sort
    switch (filters.sort) {
      case 'price_asc':
        filtered.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        break;
      case 'price_desc':
        filtered.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        break;
      case 'popular':
        filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      case 'rating':
        filtered.sort((a, b) => parseFloat(b.rating || 0) - parseFloat(a.rating || 0));
        break;
      default: // recent/newest
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    
    setFilteredProducts(filtered);
  }, [products, filters]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleCategoryChange = (catId) => {
    setFilters(prev => ({ ...prev, category: catId }));
    if (catId) {
      setSearchParams({ category: catId });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="boutique-page">
      <div className="container-fluid p-4">
        <div className="row g-4">
          {/* Sidebar Filtres */}
          <div className="col-lg-3 col-md-4">
            <div className="filters p-4 bg-white rounded-4 shadow-sm border-0">
              <h4 className="fw-bold mb-4 text-dark">Filtrer les produits</h4>

              {/* Catégories */}
              <div className="mb-4">
                <h6 className="fw-bold text-secondary mb-3">Catégories</h6>
                <div className="form-check mb-2">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="category"
                    id="all_categories"
                    value=""
                    checked={filters.category === ''}
                    onChange={() => handleCategoryChange('')}
                  />
                  <label className="form-check-label text-dark fw-medium" htmlFor="all_categories">
                    Toutes les catégories
                  </label>
                </div>
                {categories.map(cat => (
                  <div key={cat.id} className="form-check mb-2">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="category"
                      id={`cat_${cat.id}`}
                      value={cat.id}
                      checked={parseInt(filters.category) === cat.id}
                      onChange={() => handleCategoryChange(cat.id.toString())}
                    />
                    <label className="form-check-label text-dark" htmlFor={`cat_${cat.id}`}>
                      {cat.name}
                    </label>
                  </div>
                ))}
              </div>

              <hr className="my-4 text-muted" />

              {/* Tranche de Prix */}
              <div className="mb-4">
                <h6 className="fw-bold text-secondary mb-3">Tranche de Prix (XOF)</h6>
                <div className="d-flex align-items-center gap-2">
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    placeholder="Min"
                    value={filters.priceMin}
                    onChange={(e) => setFilters({ ...filters, priceMin: Math.max(0, parseInt(e.target.value) || 0) })}
                  />
                  <span className="text-muted">-</span>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    placeholder="Max"
                    value={filters.priceMax}
                    onChange={(e) => setFilters({ ...filters, priceMax: Math.max(0, parseInt(e.target.value) || 1000000) })}
                  />
                </div>
              </div>

              <hr className="my-4 text-muted" />

              {/* Tri */}
              <div className="mb-2">
                <h6 className="fw-bold text-secondary mb-3">Trier par</h6>
                <select
                  className="form-select border-light-subtle bg-light text-dark fw-medium"
                  value={filters.sort}
                  onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
                >
                  <option value="recent">Plus récent</option>
                  <option value="popular">Popularité (Vues)</option>
                  <option value="rating">Note moyenne</option>
                  <option value="price_asc">Prix: Bas vers Haut</option>
                  <option value="price_desc">Prix: Haut vers Bas</option>
                </select>
              </div>
            </div>
          </div>

          {/* Liste des Produits */}
          <div className="col-lg-9 col-md-8">
            <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
              <h3 className="fw-extrabold text-dark mb-0">
                Nos Produits {filters.search ? `pour "${filters.search}"` : ''} ({filteredProducts.length})
              </h3>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Chargement...</span>
                </div>
              </div>
            ) : filteredProducts.length > 0 ? (
              <Row className="g-4">
                {filteredProducts.map(product => (
                  <Col xl={4} md={6} key={product.id}>
                    <ProductCard product={product} />
                  </Col>
                ))}
              </Row>
            ) : (
              <div className="alert alert-info rounded-4 border-0 shadow-sm p-4 text-center">
                <h5 className="fw-bold mb-1">Aucun produit trouvé</h5>
                <p className="mb-0 text-muted">Essayez de modifier vos filtres ou effectuez une autre recherche.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BoutiquePage;
