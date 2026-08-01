const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

const categoriesData = [
  { id: 1, name: 'Céréales', description: 'Céréales locales sénégalaises de mil, maïs, fonio et niébé préparées de manière artisanale.' },
  { id: 2, name: 'Sirop', description: 'Sirops concentrés de fruits locaux du Sénégal (Bissap, Madd, Mangue, Ditakh) idéaux pour vos boissons fraîches.' },
  { id: 3, name: 'Confiture', description: 'Confitures artisanales faites à base de fruits exotiques locaux cueillis à maturité.' },
  { id: 4, name: 'Jus', description: 'Nectars et jus de fruits frais locaux, 100% naturels et riches en vitamines.' }
];

const productsData = [
  // --- Céréales (id: 1) ---
  {
    name: 'Thiakry Mangue',
    description: 'Thiakry traditionnel de mil de haute qualité mélangé à de la pulpe et des morceaux de mangue fraîche séchée de Casamance.',
    price: 1500.00,
    category_id: 1,
    stock: 50,
    image_url: 'https://images.unsplash.com/photo-1594911774802-8822a707cbb3?q=80&w=600&auto=format&fit=crop',
    discount_percent: 0,
    is_popular: true,
    is_promotion: false
  },
  {
    name: 'Thiakry Banane',
    description: 'Semoule de mil cuite à la vapeur et agrémentée de pépites de banane séchée locale pour un petit-déjeuner gourmand.',
    price: 1500.00,
    category_id: 1,
    stock: 45,
    image_url: 'https://images.unsplash.com/photo-1571115177098-24ec42ed635d?q=80&w=600&auto=format&fit=crop',
    discount_percent: 0,
    is_popular: false,
    is_promotion: false
  },
  {
    name: 'Thiakry Niébé',
    description: 'Une création innovante et nutritive à base de farine de haricot niébé précuit. Riche en protéines et sans gluten.',
    price: 1200.00,
    category_id: 1,
    stock: 30,
    image_url: 'https://images.unsplash.com/photo-1547058886-f33f81c75268?q=80&w=600&auto=format&fit=crop',
    discount_percent: 10,
    is_popular: false,
    is_promotion: true
  },
  {
    name: 'Thiakry Mil',
    description: 'Le thiakry classique sénégalais par excellence, préparé avec des grains de mil soigneusement sélectionnés.',
    price: 1000.00,
    category_id: 1,
    stock: 120,
    image_url: 'https://images.unsplash.com/photo-1574484284002-952d92456975?q=80&w=600&auto=format&fit=crop',
    discount_percent: 0,
    is_popular: true,
    is_promotion: false
  },
  {
    name: 'Fonio Local',
    description: 'Fonio précuit de Kédougou, très léger, digeste et riche en acides aminés essentiels. Prêt en quelques minutes.',
    price: 1800.00,
    category_id: 1,
    stock: 75,
    image_url: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?q=80&w=600&auto=format&fit=crop',
    discount_percent: 0,
    is_popular: true,
    is_promotion: false
  },
  {
    name: 'Couscous Mangue',
    description: 'Couscous de mil (Santhiou) subtilement aromatisé aux extraits naturels de mangue pour un mariage sucré-salé unique.',
    price: 1600.00,
    category_id: 1,
    stock: 40,
    image_url: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?q=80&w=600&auto=format&fit=crop',
    discount_percent: 0,
    is_popular: false,
    is_promotion: false
  },
  {
    name: 'Couscous Niébé',
    description: 'Couscous léger préparé à partir de farine de niébé local. Idéal pour accompagner vos sauces ou en dessert.',
    price: 1500.00,
    category_id: 1,
    stock: 35,
    image_url: 'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?q=80&w=600&auto=format&fit=crop',
    discount_percent: 0,
    is_popular: false,
    is_promotion: false
  },
  {
    name: 'Couscous Banane',
    description: 'Semoule fine de mil mélangée à de la banane locale en poudre, parfaite pour le repas du soir.',
    price: 1600.00,
    category_id: 1,
    stock: 25,
    image_url: 'https://images.unsplash.com/photo-1481349518771-20055b2a7b24?q=80&w=600&auto=format&fit=crop',
    discount_percent: 0,
    is_popular: false,
    is_promotion: false
  },
  {
    name: 'Thiakry et Couscous Pomme de Cajou',
    description: 'Un mélange exclusif de mil enrichi à la chair séchée et sucrée de la pomme de cajou de la région de Fatick.',
    price: 2000.00,
    category_id: 1,
    stock: 20,
    image_url: 'https://images.unsplash.com/photo-1508737027454-e6454ef45afd?q=80&w=600&auto=format&fit=crop',
    discount_percent: 15,
    is_popular: false,
    is_promotion: true
  },
  {
    name: 'Couscous Mil',
    description: 'Couscous traditionnel de mil (Thiéré), roulé à la main et précuit à la vapeur. Le classique des fêtes de Tamkharit.',
    price: 1200.00,
    category_id: 1,
    stock: 90,
    image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?q=80&w=600&auto=format&fit=crop',
    discount_percent: 0,
    is_popular: true,
    is_promotion: false
  },
  {
    name: 'Araw Mil',
    description: 'Granules de mil séchés de taille moyenne, prêts à être bouillis pour préparer le traditionnel Araw (bouillie).',
    price: 1000.00,
    category_id: 1,
    stock: 100,
    image_url: 'https://images.unsplash.com/photo-1596450547231-ca5a65c4b4d6?q=80&w=600&auto=format&fit=crop',
    discount_percent: 0,
    is_popular: false,
    is_promotion: false
  },
  {
    name: 'Araw Manioc',
    description: 'Granules de manioc séchés de qualité supérieure, parfaits pour des bouillies légères et digestes.',
    price: 1100.00,
    category_id: 1,
    stock: 50,
    image_url: 'https://images.unsplash.com/photo-1587132137056-bfbf0166836e?q=80&w=600&auto=format&fit=crop',
    discount_percent: 0,
    is_popular: false,
    is_promotion: false
  },
  {
    name: 'Brisures de Maïs (Sankhal)',
    description: 'Sankhal de maïs local trié et concassé, parfait pour la préparation de desserts lactés ou de plats traditionnels.',
    price: 1200.00,
    category_id: 1,
    stock: 60,
    image_url: 'https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?q=80&w=600&auto=format&fit=crop',
    discount_percent: 0,
    is_popular: false,
    is_promotion: false
  },
  {
    name: 'Farine Enrichie de Bébé',
    description: 'Farine infantile 100% naturelle composée de mil, maïs rouge, riz noir et arachide grillée pour une croissance saine.',
    price: 2500.00,
    category_id: 1,
    stock: 40,
    image_url: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?q=80&w=600&auto=format&fit=crop',
    discount_percent: 5,
    is_popular: true,
    is_promotion: true
  },

  // --- Sirop (id: 2) ---
  {
    name: 'Sirop de Bissap',
    description: 'Sirop concentré élaboré à partir des meilleures fleurs d\'hibiscus séchées du Sénégal, infusé aux feuilles de menthe (Nana).',
    price: 2000.00,
    category_id: 2,
    stock: 80,
    image_url: 'https://images.unsplash.com/photo-1497534446932-c925b458314e?q=80&w=600&auto=format&fit=crop',
    discount_percent: 0,
    is_popular: true,
    is_promotion: false
  },
  {
    name: 'Sirop de Mangue',
    description: 'Sirop onctueux préparé avec de la mangue Kent locale mûrie sur l\'arbre, sans colorant ni arôme artificiel.',
    price: 2200.00,
    category_id: 2,
    stock: 60,
    image_url: 'https://images.unsplash.com/photo-1546173159-315724a31696?q=80&w=600&auto=format&fit=crop',
    discount_percent: 0,
    is_popular: false,
    is_promotion: false
  },
  {
    name: 'Sirop de MADD',
    description: 'Sirop exotique à base de Madd sauvage (Saba senegalensis). Son goût unique, à la fois sucré et acidulé, est irrésistible.',
    price: 2500.00,
    category_id: 2,
    stock: 50,
    image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=600&auto=format&fit=crop',
    discount_percent: 10,
    is_popular: true,
    is_promotion: true
  },
  {
    name: 'Sirop de Ditakh',
    description: 'Sirop riche en fer et vitamine C préparé avec du Ditakh (Detarium senegalense) vert frais de la Casamance.',
    price: 2400.00,
    category_id: 2,
    stock: 45,
    image_url: 'https://images.unsplash.com/photo-1536935338788-846bb9981813?q=80&w=600&auto=format&fit=crop',
    discount_percent: 0,
    is_popular: false,
    is_promotion: false
  },

  // --- Confiture (id: 3) ---
  {
    name: 'Confiture de MADD',
    description: 'Confiture artisanale de Madd sauvage, cuite lentement au chaudron de cuivre pour préserver ses arômes acidulés.',
    price: 1800.00,
    category_id: 3,
    stock: 40,
    image_url: 'https://images.unsplash.com/photo-1546816570-f1551892a582?q=80&w=600&auto=format&fit=crop',
    discount_percent: 0,
    is_popular: true,
    is_promotion: false
  },
  {
    name: 'Confiture de Mangue',
    description: 'Confiture onctueuse et très fruitée, préparée avec les meilleures mangues de la saison.',
    price: 1500.00,
    category_id: 3,
    stock: 55,
    image_url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=600&auto=format&fit=crop',
    discount_percent: 0,
    is_popular: false,
    is_promotion: false
  },
  {
    name: 'Confiture de Ditakh',
    description: 'Pâte à tartiner exotique originale de Ditakh, une vraie découverte avec sa douce amertume fruitée.',
    price: 1900.00,
    category_id: 3,
    stock: 30,
    image_url: 'https://images.unsplash.com/photo-1500315331616-db4f707c24d1?q=80&w=600&auto=format&fit=crop',
    discount_percent: 0,
    is_popular: false,
    is_promotion: false
  },

  // --- Jus (id: 4) ---
  {
    name: 'Jus de Bissap',
    description: 'Boisson nationale sénégalaise, ce jus de fleurs d\'hibiscus rouge vif est très rafraîchissant et infusé à la menthe douce.',
    price: 1000.00,
    category_id: 4,
    stock: 150,
    image_url: 'https://images.unsplash.com/photo-1497534446932-c925b458314e?q=80&w=600&auto=format&fit=crop',
    discount_percent: 0,
    is_popular: true,
    is_promotion: false
  },
  {
    name: 'Jus de MADD',
    description: 'Jus de fruit sauvage Madd 100% naturel. Une boisson acidulée typique et ultra énergisante.',
    price: 1200.00,
    category_id: 4,
    stock: 80,
    image_url: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=600&auto=format&fit=crop',
    discount_percent: 0,
    is_popular: true,
    is_promotion: false
  },
  {
    name: 'Jus de Mangue',
    description: 'Un nectar épais, onctueux et parfumé fait à base de mangues locales fraîchement pressées.',
    price: 1000.00,
    category_id: 4,
    stock: 100,
    image_url: 'https://images.unsplash.com/photo-1534706936960-85d1313c8751?q=80&w=600&auto=format&fit=crop',
    discount_percent: 0,
    is_popular: true,
    is_promotion: false
  },
  {
    name: 'Jus de Ditakh',
    description: 'Jus de Ditakh frais pressé, réputé pour sa couleur verte intense et son apport important en fer.',
    price: 1200.00,
    category_id: 4,
    stock: 70,
    image_url: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?q=80&w=600&auto=format&fit=crop',
    discount_percent: 0,
    is_popular: false,
    is_promotion: false
  }
];

(async () => {
  console.log('Début du peuplement de la base de données avec les produits locaux...');

  try {
    const pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'casa_boutique',
      connectionLimit: 1
    });

    // Désactiver temporairement les contraintes de clés étrangères
    console.log('Désactivation temporaire des contraintes de clés étrangères...');
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');

    // Vider les tables liées
    console.log('Nettoyage des anciennes tables de données...');
    await pool.query('TRUNCATE TABLE reviews');
    await pool.query('TRUNCATE TABLE cart_items');
    await pool.query('TRUNCATE TABLE order_items');
    await pool.query('TRUNCATE TABLE products');
    await pool.query('TRUNCATE TABLE categories');

    // Réactiver les clés étrangères
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('Nettoyage réussi.');

    // Insérer les catégories
    console.log('Insertion des nouvelles catégories locales...');
    for (const cat of categoriesData) {
      await pool.query(
        'INSERT INTO categories (id, name, description) VALUES (?, ?, ?)',
        [cat.id, cat.name, cat.description]
      );
      console.log(` -> Catégorie ajoutée : ${cat.name}`);
    }

    // Insérer les produits
    console.log('Insertion des nouveaux produits locaux...');
    for (const prod of productsData) {
      await pool.query(
        `INSERT INTO products 
        (name, description, price, category_id, stock, image_url, discount_percent, is_popular, is_promotion) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          prod.name, 
          prod.description, 
          prod.price, 
          prod.category_id, 
          prod.stock, 
          prod.image_url, 
          prod.discount_percent, 
          prod.is_popular, 
          prod.is_promotion
        ]
      );
      console.log(` -> Produit ajouté : ${prod.name}`);
    }

    console.log('\n✅ Base de données mise à jour avec succès avec les produits locaux sénégalais !');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur lors du peuplement de la base de données :', err);
    process.exit(1);
  }
})();
