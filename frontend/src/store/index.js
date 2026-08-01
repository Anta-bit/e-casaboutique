import create from 'zustand';
import { cartService } from '../services/api';

// Store pour le panier
export const useCartStore = create((set, get) => ({
  items: JSON.parse(localStorage.getItem('cart')) || [],
  loading: false,

  fetchCart: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    set({ loading: true });
    try {
      const response = await cartService.getCart();
      const items = response.data.items || [];
      set({ items, loading: false });
      localStorage.setItem('cart', JSON.stringify(items));
    } catch (error) {
      console.error('Erreur lors du chargement du panier:', error);
      set({ loading: false });
    }
  },

  addItem: async (product, quantity = 1) => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await cartService.addItem(product.id, quantity);
        await get().fetchCart();
      } catch (error) {
        console.error('Erreur lors de l\'ajout au panier:', error);
      }
    } else {
      set((state) => {
        const existingItem = state.items.find(item => item.id === product.id);
        let newItems;

        if (existingItem) {
          newItems = state.items.map(item =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        } else {
          newItems = [...state.items, { ...product, quantity }];
        }

        localStorage.setItem('cart', JSON.stringify(newItems));
        return { items: newItems };
      });
    }
  },

  removeItem: async (productId) => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await cartService.removeItem(productId);
        await get().fetchCart();
      } catch (error) {
        console.error('Erreur lors de la suppression du produit:', error);
      }
    } else {
      set((state) => {
        const newItems = state.items.filter(item => item.id !== productId);
        localStorage.setItem('cart', JSON.stringify(newItems));
        return { items: newItems };
      });
    }
  },

  updateQuantity: async (productId, quantity) => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await cartService.updateItem(productId, quantity);
        await get().fetchCart();
      } catch (error) {
        console.error('Erreur lors de la mise à jour de la quantité:', error);
      }
    } else {
      set((state) => {
        const newItems = state.items.map(item =>
          item.id === productId ? { ...item, quantity } : item
        );
        localStorage.setItem('cart', JSON.stringify(newItems));
        return { items: newItems };
      });
    }
  },

  clearCart: async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await cartService.clearCart();
        set({ items: [] });
        localStorage.removeItem('cart');
      } catch (error) {
        console.error('Erreur lors du nettoyage du panier:', error);
      }
    } else {
      localStorage.removeItem('cart');
      set({ items: [] });
    }
  },

  getTotal: () => {
    const items = get().items;
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  },

  getItemCount: () => {
    return get().items.reduce((count, item) => count + item.quantity, 0);
  }
}));

// Store pour l'authentification
export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  isLoading: false,

  setUser: (user, token) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    set({ user, token });
    // Charger le panier après connexion
    useCartStore.getState().fetchCart();
  },

  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    set({ user: null, token: null });
    // Vider le panier après déconnexion
    useCartStore.getState().clearCart();
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
}));

// Store pour les produits
export const useProductStore = create((set) => ({
  products: [],
  filteredProducts: [],
  loading: false,
  error: null,

  setProducts: (products) => set({ products, filteredProducts: products }),

  filterByCategory: (category) => {
    set((state) => ({
      filteredProducts: category
        ? state.products.filter(p => p.category_name === category || p.category_id === parseInt(category))
        : state.products
    }));
  },

  searchProducts: (query) => {
    set((state) => ({
      filteredProducts: state.products.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.description.toLowerCase().includes(query.toLowerCase())
      )
    }));
  },

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error })
}));

// Store pour les paramètres
export const useSettingsStore = create((set) => ({
  language: localStorage.getItem('language') || 'fr',
  theme: localStorage.getItem('theme') || 'light',
  notifications: JSON.parse(localStorage.getItem('notifications')) || { email: true, sms: false },

  setLanguage: (language) => {
    localStorage.setItem('language', language);
    set({ language });
  },

  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    set({ theme });
  },

  setNotifications: (notifications) => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
    set({ notifications });
  }
}));

const storeExports = {
  useCartStore,
  useAuthStore,
  useProductStore,
  useSettingsStore
};

export default storeExports;
