# ⚡ Démarrage Rapide Casa Boutique

## 🚀 30 Secondes pour Démarrer

### Terminal 1 - Démarrer le Backend

```bash
cd /Users/macbook/Documents/casaboutique/backend

# 1. Installer les dépendances (première fois uniquement)
npm install

# 2. Configurer la base de données
mysql -u root < database.sql

# 3. Créer le fichier .env
cp .env.example .env
# Éditer .env avec vos paramètres

# 4. Démarrer le serveur
npm run dev

# ✅ Serveur lancé sur http://localhost:5000
```

### Terminal 2 - Démarrer le Frontend

```bash
cd /Users/macbook/Documents/casaboutique/frontend

# 1. Installer les dépendances (première fois uniquement)
npm install

# 2. Démarrer l'application React
npm start

# ✅ App lancée sur http://localhost:3000
```

---

## 📋 Checklist de Configuration

### MySQL
- [ ] MySQL est installé et lancé
- [ ] Database `casa_boutique` est créée
- [ ] Tables sont initialisées

### Backend
- [ ] Node.js v14+ est installé
- [ ] `npm install` exécuté
- [ ] `.env` configuré avec:
  - `DB_HOST`, `DB_USER`, `DB_PASSWORD`
  - `JWT_SECRET`
  - Clés PayTech/Wave/Orange (optionnel pour tests)

### Frontend
- [ ] `npm install` exécuté
- [ ] `.env` configuré avec:
  - `REACT_APP_API_URL=http://localhost:5000/api`

---

## 🧪 Test de l'Application

### 1. Créer un compte
- Allez sur http://localhost:3000
- Cliquez sur "S'inscrire"
- Remplissez le formulaire

### 2. Se connecter
- Utilisez vos identifiants
- Vous verrez votre panier

### 3. Tester le panier
- Naviguez vers la boutique
- Ajoutez un produit au panier
- Vérifiez que le panier se met à jour

### 4. Tester le paiement (Mock)
- Allez au checkout
- Choisissez PayTech
- Vous serez redirigé vers le paiement

---

## 📁 Fichiers Importants

```
casaboutique/
├── SETUP.md                      ← Guide de configuration
├── PROGRESS.md                   ← Statut du projet
├── PAYMENT_INTEGRATION.md        ← Guide des paiements
├── REACT_PAGES.md                ← Exemples de code React
├── README.md                     ← Documentation principale
├── QUICK_START.md                ← Ce fichier
│
├── backend/
│   ├── server.js                 ← Serveur Express
│   ├── database.sql              ← Schéma MySQL
│   ├── .env.example              ← Template variables
│   ├── .env                      ← Variables (À créer)
│   ├── routes/                   ← Tous les endpoints
│   ├── middleware/auth.js        ← Authentification JWT
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── App.js                ← Routage principal
    │   ├── services/api.js       ← Appels API
    │   ├── store/index.js        ← État global
    │   ├── pages/                ← Pages React
    │   └── components/           ← Composants réutilisables
    └── package.json
```

---

## 🔐 Comptes de Test

### Admin
- Email: `admin@casaboutique.com`
- Password: `Admin@123`

Créez-le en inscrivant puis mettez à jour le rôle en MySQL:
```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@casaboutique.com';
```

### Client Normal
- Email: `client@casaboutique.com`
- Password: `Client@123`

---

## 🛠️ Commandes Utiles

### Backend

```bash
cd backend

# Développement avec auto-reload
npm run dev

# Démarrage normal
npm start

# Voir les logs
npm run dev 2>&1 | tee app.log

# Arrêter le serveur
Ctrl + C

# Réinitialiser la BDD
mysql -u root < database.sql
```

### Frontend

```bash
cd frontend

# Développement
npm start

# Build pour production
npm run build

# Tests
npm test

# Arrêter
Ctrl + C
```

---

## 🚨 Troubleshooting

### Erreur: "Cannot find module"
```bash
# Solution: Réinstaller les modules
rm -rf node_modules package-lock.json
npm install
```

### Erreur: "Port 5000 already in use"
```bash
# Trouver le processus
lsof -i :5000

# Tuer le processus
kill -9 <PID>

# Ou utiliser un autre port dans .env
PORT=5001
```

### Erreur: "Cannot connect to database"
```bash
# Vérifier que MySQL tourne
mysql -u root -p
# Tapez votre password, si ça marche, MySQL fonctionne

# Vérifier .env
cat backend/.env
# Assurez-vous que DB_HOST, DB_USER correct
```

### Erreur: "404 Not Found API"
```bash
# Vérifier que le backend fonctionne
curl http://localhost:5000/api/health

# Vérifier que REACT_APP_API_URL est correct
cat frontend/.env
```

### Frontend ne se charge pas
```bash
# Si le port 3000 est occup
npm start -- --port 3001

# Ou vérifier que le backend fonctionne
curl http://localhost:5000/api/health
```

---

## 📞 Contacts API

### Health Check
```bash
curl http://localhost:5000/api/health
```

Doit retourner:
```json
{
  "status": "OK",
  "message": "Server is running"
}
```

### Liste des Produits
```bash
curl http://localhost:5000/api/products
```

### Inscription
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123",
    "first_name": "Test",
    "last_name": "User"
  }'
```

---

## 📚 Documentation Supplémentaire

- [SETUP.md](./SETUP.md) - Configuration détaillée
- [PROGRESS.md](./PROGRESS.md) - Statut du projet
- [PAYMENT_INTEGRATION.md](./PAYMENT_INTEGRATION.md) - Paiements
- [REACT_PAGES.md](./REACT_PAGES.md) - Code React
- [README.md](./README.md) - Documentation complète

---

## 🎯 Prochaines Étapes

Après le démarrage réussi:

1. **Tester la navigation**
   - [ ] Page d'accueil fonctionne
   - [ ] Recherche de produits fonctionne
   - [ ] Panier se met à jour
   - [ ] Le checkout charge

2. **Configurer les paiements** (optionnel)
   - [ ] Créer compte PayTech
   - [ ] Ajouter les clés API
   - [ ] Tester un paiement

3. **Personnaliser le design**
   - [ ] Ajouter votre logo
   - [ ] Changer les couleurs
   - [ ] Ajouter vos images

4. **Ajouter des produits**
   - Allez sur http://localhost:3000/admin
   - Créez des catégories
   - Ajoutez des produits

---

## 💡 Tips

1. **Utiliser des variables d'env séparées par environnement:**
   ```bash
   .env.local    # Votre machine
   .env.dev      # Développement
   .env.prod     # Production
   ```

2. **Activer les logs API:**
   - Ouvrir DevTools (F12)
   - Aller à Network
   - Faire une action
   - Voir la requête et réponse

3. **Déboguer le frontend:**
   - Ajouter des `console.log()` partout
   - Utiliser React DevTools
   - Utiliser Redux DevTools (si vous avez Redux)

4. **Déboguer le backend:**
   - Utiliser Postman pour tester les endpoints
   - Ajouter des logs avec `console.log()`
   - Utiliser un debugger: `node --inspect server.js`

---

## ✅ Checklist Final

Avant de dire que c'est "Prêt en Production":

- [ ] Inscription/Connexion fonctionne
- [ ] Page d'accueil charge les produits
- [ ] Recherche fonctionne
- [ ] Ajouter au panier fonctionne
- [ ] Checkout fonctionne
- [ ] Paiement fonctionne (test)
- [ ] Dashboard admin charge
- [ ] Profil client fonctionne
- [ ] Tous les CSS chargent
- [ ] Pas d'erreurs en console

---

**Prêt? Commencez avec Terminal 1 et Terminal 2 ci-dessus!** 🚀

