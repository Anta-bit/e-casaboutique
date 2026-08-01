import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Carousel, Row, Col, Container, Card } from 'react-bootstrap';
import { productService, categoryService } from '../services/api';
import ProductCard from '../components/ProductCard';
import { FiTrendingUp, FiShoppingBag, FiPercent, FiGift, FiTruck, FiShield, FiRotateCcw, FiPhoneCall } from 'react-icons/fi';
import './HomePage.css';

function HomePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(3600 * 4 + 1200); // 4 hours 20 minutes countdown

  // Countdown timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 3600 * 4));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const categoriesRes = await categoryService.getAll();
      setCategories(categoriesRes.data);

      const productsRes = await productService.getAll();
      setProducts(productsRes.data);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter sections
  const popularProducts = products.filter(p => p.is_popular === 1 || p.is_popular === true).slice(0, 6);
  const recentProducts = [...products].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 6);
  const promoProducts = products.filter(p => p.is_promotion === 1 || p.is_promotion === true || p.discount_percent > 0).slice(0, 8);

  const fallbackPopular = popularProducts.length > 0 ? popularProducts : products.slice(0, 6);
  const fallbackRecent = recentProducts.length > 0 ? recentProducts : products.slice(0, 6);
  const fallbackPromo = promoProducts.length > 0 ? promoProducts : products.slice(0, 8);

  return (
    <div className="homepage">
      {/* JUMIA-LIKE HERO SECTION */}
      <section className="hero-section py-4 bg-light">
        <Container>
          <Row className="g-3">
            {/* 1. Category Sidebar */}
            <Col lg={3} className="d-none d-lg-block">
              <Card className="border-0 shadow-sm rounded-3 overflow-hidden h-100 category-sidebar">
                <Card.Body className="p-0">
                  <div className="bg-dark text-white px-3 py-2 fw-bold d-flex align-items-center gap-2">
                    <FiShoppingBag /> Catégories
                  </div>
                  <ul className="list-group list-group-flush py-2">
                    {categories.map((category) => (
                      <li key={category.id} className="list-group-item border-0 py-2 px-3 category-item">
                        <Link to={`/boutique?category=${category.id}`} className="text-decoration-none text-dark d-flex align-items-center justify-content-between">
                          <span>
                            <span className="me-2">
                              {category.name === 'Céréales' && '🌾'}
                              {category.name === 'Sirop' && '🍾'}
                              {category.name === 'Confiture' && '🍯'}
                              {category.name === 'Jus' && '🍹'}
                              {!['Céréales', 'Sirop', 'Confiture', 'Jus'].includes(category.name) && '📦'}
                            </span>
                            {category.name}
                          </span>
                          <span className="text-muted fs-8">❯</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </Card.Body>
              </Card>
            </Col>

            {/* 2. Main Carousel */}
            <Col lg={6} md={8}>
              <Carousel className="main-carousel rounded-3 shadow-sm overflow-hidden h-100" interval={4000}>
                <Carousel.Item className="carousel-banner-item">
                  <img
                    className="d-block w-100"
                    src="https://images.unsplash.com/photo-1574484284002-952d92456975?auto=format&fit=crop&w=800&h=400&q=80"
                    alt="Céréales de la Casamance"
                  />
                  <Carousel.Caption className="carousel-caption-bg">
                    <h3 className="fw-extrabold text-uppercase text-white">Céréales de la Casamance</h3>
                    <p>Thiakry, Couscous de Mil et Fonio 100% naturels pour votre bien-être.</p>
                    <Link to="/boutique?category=1" className="btn btn-primary fw-bold">Découvrir le Catalogue</Link>
                  </Carousel.Caption>
                </Carousel.Item>

                <Carousel.Item className="carousel-banner-item">
                  <img
                    className="d-block w-100"
                    src="https://images.unsplash.com/photo-1497534446932-c925b458314e?auto=format&fit=crop&w=800&h=400&q=80"
                    alt="Sirops & Jus locaux"
                  />
                  <Carousel.Caption className="carousel-caption-bg">
                    <h3 className="fw-extrabold text-uppercase text-white">Nectars & Sirops Naturels</h3>
                    <p>Bissap infusé, Madd sauvage et Ditakh frais de Casamance pour vous rafraîchir.</p>
                    <Link to="/boutique?category=2" className="btn btn-primary fw-bold">Acheter</Link>
                  </Carousel.Caption>
                </Carousel.Item>

                <Carousel.Item className="carousel-banner-item">
                  <img
                    className="d-block w-100"
                    src="https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&h=400&q=80"
                    alt="Confitures artisanales"
                  />
                  <Carousel.Caption className="carousel-caption-bg">
                    <h3 className="fw-extrabold text-uppercase text-white">Délices & Confitures</h3>
                    <p>Des confitures de fruits tropicaux locaux cuites lentement de façon traditionnelle.</p>
                    <Link to="/boutique?category=3" className="btn btn-primary fw-bold">Découvrir</Link>
                  </Carousel.Caption>
                </Carousel.Item>
              </Carousel>
            </Col>

            {/* 3. Right Promo Widgets */}
            <Col lg={3} md={4}>
              <div className="d-flex flex-column gap-3 h-100 justify-content-between">
                <Card className="border-0 shadow-sm rounded-3 bg-gradient-orange text-white p-3 text-center flex-grow-1 flex-shrink-0 d-flex flex-column justify-content-center">
                  <FiPercent size={32} className="mx-auto mb-2 text-warning animate-bounce" />
                  <h5 className="fw-bold">Super Promos</h5>
                  <p className="small mb-2 text-white-80">Jusqu'à -70% sur les fins de séries.</p>
                  <Link to="/boutique?sort=price_asc" className="btn btn-light btn-sm fw-bold text-primary mx-auto px-3 py-1">En profiter</Link>
                </Card>
                <Card className="border-0 shadow-sm rounded-3 bg-gradient-purple text-white p-3 text-center flex-grow-1 flex-shrink-0 d-flex flex-column justify-content-center">
                  <FiGift size={32} className="mx-auto mb-2 text-info animate-pulse" />
                  <h5 className="fw-bold">Cartes Cadeaux</h5>
                  <p className="small mb-2 text-white-80">Faites plaisir à vos proches en un clic.</p>
                  <button className="btn btn-light btn-sm fw-bold text-purple mx-auto px-3 py-1">Acheter</button>
                </Card>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* QUICK CATEGORIES CIRCLES */}
      <section className="categories-quick py-4 bg-white">
        <Container>
          <div className="d-flex align-items-center gap-3 mb-4">
            <h3 className="fw-bold text-dark mb-0">Nos Catégories Populaires</h3>
          </div>
          <Row className="g-3 justify-content-center">
            {categories.map((category) => (
              <Col xs={6} sm={4} md={2} key={category.id} className="text-center">
                <Link to={`/boutique?category=${category.id}`} className="text-decoration-none category-circle-link">
                  <div className="category-circle mx-auto mb-2 d-flex align-items-center justify-content-center shadow-sm">
                    {category.name === 'Céréales' && '🌾'}
                    {category.name === 'Sirop' && '🍾'}
                    {category.name === 'Confiture' && '🍯'}
                    {category.name === 'Jus' && '🍹'}
                    {!['Céréales', 'Sirop', 'Confiture', 'Jus'].includes(category.name) && '📦'}
                  </div>
                  <span className="fw-semibold text-dark fs-7 d-block">{category.name}</span>
                </Link>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* FLASH SALES (VENTES FLASH) */}
      <section className="flash-sales py-4">
        <Container>
          <Card className="border-0 shadow-sm rounded-4 overflow-hidden bg-white">
            <Card.Header className="bg-gradient-red text-white py-3 px-4 d-flex align-items-center justify-content-between flex-wrap gap-2">
              <div className="d-flex align-items-center gap-3">
                <h4 className="fw-bold mb-0 text-white">🔥 Ventes Flash</h4>
                <div className="flash-timer bg-dark text-warning px-3 py-1 rounded-pill font-monospace fw-bold">
                  {formatTime(timeLeft)}
                </div>
              </div>
              <Link to="/boutique?sort=popular" className="btn btn-outline-light btn-sm fw-bold rounded-pill px-3">Voir tout</Link>
            </Card.Header>
            <Card.Body className="p-4">
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-danger" role="status">
                    <span className="visually-hidden">Chargement...</span>
                  </div>
                </div>
              ) : (
                <div className="horizontal-scroll-container">
                  <div className="horizontal-scroll-track">
                    {fallbackPromo.map(product => (
                      <div key={product.id} className="scroll-card-item">
                        <ProductCard product={product} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Container>
      </section>

      {/* POPULAR PRODUCTS */}
      <section className="popular-products py-4 bg-light">
        <Container>
          <div className="d-flex align-items-center justify-content-between mb-4">
            <h3 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
              <FiTrendingUp className="text-primary" /> Produits Populaires
            </h3>
            <Link to="/boutique" className="text-primary text-decoration-none fw-bold hover-underline">Voir tout ➔</Link>
          </div>
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
            </div>
          ) : (
            <Row className="g-4">
              {fallbackPopular.map(product => (
                <Col lg={4} md={6} key={product.id}>
                  <ProductCard product={product} />
                </Col>
              ))}
            </Row>
          )}
        </Container>
      </section>

      {/* RECENT PRODUCTS */}
      <section className="recent-products py-4 bg-white">
        <Container>
          <div className="d-flex align-items-center justify-content-between mb-4">
            <h3 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
              <FiShoppingBag className="text-success" /> Nouveautés
            </h3>
            <Link to="/boutique?sort=recent" className="text-primary text-decoration-none fw-bold hover-underline">Voir tout ➔</Link>
          </div>
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-success" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
            </div>
          ) : (
            <Row className="g-4">
              {fallbackRecent.map(product => (
                <Col lg={4} md={6} key={product.id}>
                  <ProductCard product={product} />
                </Col>
              ))}
            </Row>
          )}
        </Container>
      </section>

      {/* CUSTOMER VALUE STATS */}
      <section className="advantages py-5 bg-light border-top">
        <Container>
          <Row className="g-4 text-center">
            <Col md={3} sm={6}>
              <div className="advantage-card p-3 shadow-sm rounded-3 bg-white h-100 d-flex flex-column align-items-center justify-content-center">
                <FiTruck size={36} className="text-primary mb-3" />
                <h5 className="fw-bold">Livraison Rapide</h5>
                <p className="text-muted small mb-0">Reçu chez vous sous 24h à 48h dans tout le Sénégal.</p>
              </div>
            </Col>
            <Col md={3} sm={6}>
              <div className="advantage-card p-3 shadow-sm rounded-3 bg-white h-100 d-flex flex-column align-items-center justify-content-center">
                <FiShield size={36} className="text-success mb-3" />
                <h5 className="fw-bold">Paiement 100% Sécurisé</h5>
                <p className="text-muted small mb-0">Réglez facilement via PayTech, Wave ou Orange Money.</p>
              </div>
            </Col>
            <Col md={3} sm={6}>
              <div className="advantage-card p-3 shadow-sm rounded-3 bg-white h-100 d-flex flex-column align-items-center justify-content-center">
                <FiRotateCcw size={36} className="text-warning mb-3" />
                <h5 className="fw-bold">Retours Gratuits</h5>
                <p className="text-muted small mb-0">Satisfait ou remboursé, retours facilités sous 7 jours.</p>
              </div>
            </Col>
            <Col md={3} sm={6}>
              <div className="advantage-card p-3 shadow-sm rounded-3 bg-white h-100 d-flex flex-column align-items-center justify-content-center">
                <FiPhoneCall size={36} className="text-danger mb-3" />
                <h5 className="fw-bold">Assistance 24/7</h5>
                <p className="text-muted small mb-0">Un service client dévoué pour répondre à toutes vos questions.</p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
}

export default HomePage;
