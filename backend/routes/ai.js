const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const multer = require('multer');

// Configuration de Multer pour stocker le fichier audio en mémoire temporairement
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // Limite à 10 Mo par enregistrement
});

// Initialiser le SDK Gemini si la clé API est fournie
let genAI = null;
if (process.env.GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de Gemini:', error);
  }
} else {
  console.warn('⚠️ GEMINI_API_KEY n\'est pas définie dans le fichier .env. Le mode démo est activé.');
}

// Endpoint 1 : Transcription Vocale (Speech-to-Text) Wolof/Français
router.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier audio reçu' });
    }

    console.log(`Fichier audio reçu pour transcription : ${req.file.originalname} (${req.file.size} octets), type: ${req.file.mimetype}`);

    // Mode démo / de secours si la clé API n'est pas définie
    if (!genAI) {
      console.log('Mode démo activé pour la transcription.');
      // Simuler une réponse selon la taille ou générer un texte générique
      return res.json({ text: "Nanga def" });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Appel à Gemini avec l'audio en données intégrées (inlineData)
    const result = await model.generateContent([
      {
        inlineData: {
          data: req.file.buffer.toString('base64'),
          mimeType: req.file.mimetype || 'audio/webm'
        }
      },
      "Rédige uniquement la transcription textuelle exacte de cet audio en respectant la langue parlée (comme le Wolof ou le Français). Ne rajoute aucune introduction, aucune explication et aucun commentaire. Sois le plus précis possible."
    ]);

    const transcribedText = result.response.text().trim();
    console.log('Transcription générée par Gemini :', transcribedText);

    res.json({ text: transcribedText });

  } catch (error) {
    console.error('Erreur lors de la transcription audio par Gemini:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la transcription' });
  }
});

// Endpoint 2 : Chatbot Assistant (Wolof/Français/Anglais)
router.post('/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ message: 'Historique des messages requis' });
    }

    const lastMessage = messages[messages.length - 1];
    const userMessageContent = lastMessage.content || '';
    const pool = req.pool;

    // Recherche de produits correspondants dans la base de données
    let productsList = [];
    const keywords = userMessageContent.split(/\s+/).filter(w => w.length > 3);
    
    if (keywords.length > 0) {
      let query = `
        SELECT p.id, p.name, p.description, p.price, p.stock, c.name as category_name 
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE 1=0
      `;
      const params = [];
      keywords.forEach(kw => {
        query += ` OR p.name LIKE ? OR p.description LIKE ? OR c.name LIKE ?`;
        params.push(`%${kw}%`, `%${kw}%`, `%${kw}%`);
      });
      query += ` LIMIT 6`;
      
      try {
        const [rows] = await pool.query(query, params);
        productsList = rows;
      } catch (err) {
        console.error('Erreur lors de la recherche produit pour l\'IA:', err);
      }
    }

    // Récupérer des produits populaires si aucun mot-clé ne correspond ou pour donner du contexte
    if (productsList.length === 0) {
      try {
        const [rows] = await pool.query(`
          SELECT p.id, p.name, p.description, p.price, p.stock, c.name as category_name 
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          ORDER BY p.views DESC LIMIT 4
        `);
        productsList = rows;
      } catch (err) {
        console.error('Erreur récupération produits populaires pour l\'IA:', err);
      }
    }

    // Construction du prompt système
    const systemInstruction = `
Tu es "Casa IA", le guide et assistant virtuel intelligent de "Casa Boutique", un site d'e-commerce moderne au Sénégal.
Ton but principal est d'aider les clients à naviguer sur le site, trouver des articles, et finaliser leurs commandes.

SUPPORT MULTILINGUE (TRÈS IMPORTANT) :
- Wolof : Si l'utilisateur te parle en wolof ou semble sénégalais, réponds-lui en wolof chaleureux, poli et facile à comprendre. Utilise des salutations comme "Nanga def", "Sante yalla", "Jërëjëf", "Mbaa ya ngi fi".
- Français : Si l'utilisateur te parle en français, réponds en français clair et poli.
- Anglais : Réponds en anglais si l'utilisateur s'adresse à toi en anglais.
Sois extrêmement bienveillant et serviable, surtout si l'utilisateur exprime qu'il a du mal à utiliser le site.

STRUCTURE DE NAVIGATION DU SITE :
- Page d'accueil : /
- Boutique (tous les produits) : /boutique
- Panier (voir ses articles choisis) : /cart
- Validation / Commande (finaliser son achat) : /checkout
- Profil (historique, adresse, infos) : /profile
- Connexion (se connecter) : /login
- Inscription (créer un compte) : /register

FORMAT DE RÉPONSE STRICT (OBLIGATOIRE) :
Tu dois répondre UNIQUEMENT sous la forme d'un objet JSON brut valide avec la structure suivante :
{
  "reply": "Ta réponse textuelle adressée au client (en wolof, français ou anglais, selon son message). Explique ce qu'il doit faire ou où cliquer de façon très simple.",
  "action": {
    "type": "navigate" ou "none",
    "payload": "Le chemin URL exact où le rediriger (ex: '/cart', '/checkout', '/boutique', '/login') s'il te demande d'y aller, de voir son panier, de commander, de se connecter, ou si tu penses que c'est la suite logique pour l'aider."
  }
}

Exemple en Wolof si l'utilisateur dit "Dama bëgg guiss sama panier" :
{
  "reply": "Ahan ! Lii moy sa panier, mën nga ci guiss sa ciy article yepp. (Voici votre panier, vous pouvez y voir tous vos articles.)",
  "action": {
    "type": "navigate",
    "payload": "/cart"
  }
}

Exemple en Français si l'utilisateur dit "Comment je fais pour commander ?" :
{
  "reply": "Pour commander, c'est très simple ! Je vous redirige vers la page de commande pour valider vos informations et choisir votre mode de paiement (Wave, Orange Money ou PayTech).",
  "action": {
    "type": "navigate",
    "payload": "/checkout"
  }
}

Voici la liste de quelques produits disponibles en stock à proposer ou conseiller si le client cherche des produits :
${JSON.stringify(productsList, null, 2)}
`;

    // Appel de Gemini ou fallback démonstration
    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ 
          model: 'gemini-2.5-flash',
          generationConfig: {
            responseMimeType: 'application/json'
          }
        });

        // Préparer l'historique des messages
        const promptMessages = [
          { role: 'user', parts: [{ text: systemInstruction }] },
          { role: 'model', parts: [{ text: 'D\'accord, je suis Casa IA. Je répondrai uniquement au format JSON demandé avec le message en Wolof/Français et les actions appropriées.' }] }
        ];

        // Ajouter l'historique récent
        messages.forEach((msg) => {
          promptMessages.push({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
          });
        });

        const result = await model.generateContent({
          contents: promptMessages
        });

        const textResponse = result.response.text();
        
        try {
          const jsonResponse = JSON.parse(textResponse);
          return res.json(jsonResponse);
        } catch (parseErr) {
          console.error('Erreur lors du parsing JSON de Gemini:', textResponse, parseErr);
          return res.json({
            reply: "Jëf. Am nañu problème touti. Mën nga ma waxaat li nga bëgg ? (Merci. Nous avons un petit souci. Pouvez-vous me redire ce que vous souhaitez ?)",
            action: { type: 'none', payload: '' }
          });
        }
      } catch (geminiError) {
        console.error('Erreur lors de l\'appel à Gemini API:', geminiError);
      }
    }

    // Mode Démo / Fallback intelligent si clé absente ou erreur API
    console.log('Mode démo / Fallback activé pour l\'assistant IA');
    const queryLower = userMessageContent.toLowerCase();
    let reply = "";
    let action = { type: 'none', payload: '' };

    if (queryLower.includes('panier') || queryLower.includes('cart') || queryLower.includes('li nekk ci biir')) {
      reply = "Ahan ! Lii moy sa panier, mën nga ci guiss li nga fa def. (Voici votre panier, vous pouvez y voir vos articles.)";
      action = { type: 'navigate', payload: '/cart' };
    } else if (queryLower.includes('checkout') || queryLower.includes('payer') || queryLower.includes('commander') || queryLower.includes('faye')) {
      reply = "Waaw, pour nga faye wala nga valider sa commande, lii moy caisse bi. (Oui, pour payer ou valider votre commande, voici la caisse.)";
      action = { type: 'navigate', payload: '/checkout' };
    } else if (queryLower.includes('boutique') || queryLower.includes('magasin') || queryLower.includes('produit') || queryLower.includes('marchandise') || queryLower.includes('jeund')) {
      reply = "Mën nga parcourir boutique bi ngir xool yeere yi ak yeneen produit yi fi nekk. (Vous pouvez parcourir la boutique pour voir les habits et autres produits disponibles.)";
      action = { type: 'navigate', payload: '/boutique' };
    } else if (queryLower.includes('profil') || queryLower.includes('compte') || queryLower.includes('adresse')) {
      reply = "Lii moy sa profil, fi mën nga modifier sa adresse ak sa telephone. (Voici votre profil, vous pouvez y modifier votre adresse et votre téléphone.)";
      action = { type: 'navigate', payload: '/profile' };
    } else if (queryLower.includes('connexion') || queryLower.includes('connecter') || queryLower.includes('login')) {
      reply = "Pour nga connecter, fi la. Saisir sa email ak sa mot de passe. (Pour vous connecter, c'est ici. Saisissez votre email et mot de passe.)";
      action = { type: 'navigate', payload: '/login' };
    } else if (queryLower.includes('nanga') || queryLower.includes('salut') || queryLower.includes('bonjour') || queryLower.includes('hello')) {
      reply = "Nanga def ! Casa IA laa tudd, maa ngi lay nuyu. Naka laay mën a dimbalé tey ngir nga naviguer ci site bi ? (Bonjour ! Je m'appelle Casa IA. Comment puis-je vous aider aujourd'hui à naviguer sur le site ?)";
    } else {
      reply = "Jërëjëf ! Maa ngi lay déglu. Mën nga ma lacc pour ma guindi la ci site bi wala ma wane la boutique bi. (Merci ! Je vous écoute. Vous pouvez me demander de vous guider sur le site ou de vous montrer la boutique.)";
    }

    return res.json({ reply, action });

  } catch (error) {
    console.error('Erreur générale Assistant IA:', error);
    res.status(500).json({ message: 'Erreur interne de l\'assistant' });
  }
});

module.exports = router;
