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
  addToCart(item: Omit<Product, 'quantity'>): Promise<void>;
  increment(id: string): Promise<void>;
  decrement(id: string): Promise<void>;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const data = await AsyncStorage.getItem('@GoMarketPlace:products');

      if (data) {
        setProducts(JSON.parse(data));
      }
      // await AsyncStorage.clear();
    }

    loadProducts();
  }, []);

  useEffect(() => {
    async function writeAsyncStorage(): Promise<void> {
      await AsyncStorage.setItem(
        '@GoMarketPlace:products',
        JSON.stringify(products),
      );
    }

    writeAsyncStorage();
  }, [products]);

  const addToCart = useCallback(
    async product => {
      const { id, title, image_url, price } = product;

      const existingProductId = products.findIndex(item => item.id === id);

      if (existingProductId < 0) {
        const addedProduct: Product = {
          id,
          title,
          image_url,
          price,
          quantity: 1,
        };

        setProducts([...products, addedProduct]);
      } else {
        const addedProduct = products[existingProductId];
        addedProduct.quantity += 1;

        setProducts(
          products.map(item =>
            item.id === addedProduct.id ? addedProduct : item,
          ),
        );
      }

      // await AsyncStorage.setItem(
      //   '@GoMarketPlace:products',
      //   JSON.stringify(products),
      // );
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const selectedProductId = products.findIndex(item => item.id === id);
      const selectedProduct = products[selectedProductId];
      selectedProduct.quantity += 1;

      setProducts(
        products.map(item =>
          item.id === selectedProduct.id ? selectedProduct : item,
        ),
      );

      // await AsyncStorage.setItem(
      //   '@GoMarketPlace:products',
      //   JSON.stringify(products),
      // );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const selectedProductId = products.findIndex(item => item.id === id);
      const selectedProduct = products[selectedProductId];

      if (selectedProduct.quantity <= 1) {
        setProducts(products.filter(item => item.id !== selectedProduct.id));
      } else {
        selectedProduct.quantity -= 1;
        setProducts(
          products.map(item =>
            item.id === selectedProduct.id ? selectedProduct : item,
          ),
        );
      }

      // await AsyncStorage.setItem(
      //   '@GoMarketPlace:products',
      //   JSON.stringify(products),
      // );
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
