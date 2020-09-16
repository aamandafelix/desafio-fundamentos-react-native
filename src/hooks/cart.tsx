import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storedProducts = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );

      if (storedProducts) {
        setProducts([...JSON.parse(storedProducts)]);
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      let updatedProducts = [];

      const existingProduct = products.find(item => item.id === product.id);

      if (existingProduct) {
        updatedProducts = products.map(item => {
          if (item.id === existingProduct.id) {
            return {
              ...item,
              quantity: item.quantity + 1,
            };
          }
          return item;
        });
      } else {
        updatedProducts = [...products, { ...product, quantity: 1 }];
      }

      setProducts(updatedProducts);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(updatedProducts),
      );
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const updatedProducts = products.map(product => {
        if (product.id === id) {
          return {
            ...product,
            quantity: product.quantity + 1,
          };
        }
        return product;
      });

      setProducts(updatedProducts);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(updatedProducts),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      let updatedProducts = [];

      updatedProducts = products.map(item => {
        if (item.id === id) {
          return {
            ...item,
            quantity: item.quantity - 1,
          };
        }
        return item;
      });

      const product = updatedProducts.find(item => item.id === id);

      if (product && product.quantity === 0) {
        const productIndex = updatedProducts.findIndex(
          item => item.id === product.id,
        );

        updatedProducts.splice(productIndex, 1);
      }

      setProducts(updatedProducts);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(updatedProducts),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
