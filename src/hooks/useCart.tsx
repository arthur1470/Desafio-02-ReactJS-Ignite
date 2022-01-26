import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');
    
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }    

    return [];
  });

  const addProduct = async (productId: number) => {
    
    try {
      let isInCart = false;
      let amount = 0;
      const updatedProducts = [...cart];
      
      updatedProducts.map(product => {
        if(product.id === productId) {
          amount = product.amount + 1;
          isInCart = true;
        }                
      })

      if (isInCart) {
        updateProductAmount({productId, amount});
      } else {        
        await api.get(`/products/${productId}`)
          .then((response) => {        
            const product:Product = response.data;
            product.amount = 1;                        
            updatedProducts.push(product);            
          })                                       
         
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedProducts))
      }
      
      setCart(updatedProducts);
    } catch(e) {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {      
      const updatedProducts = cart.filter(product => product.id !== productId);

      if(cart.length === updatedProducts.length) {
        throw new Error;
      }

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedProducts))
      setCart(updatedProducts);
      
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        return;
      }

      const updatedProducts = [...cart];

      await api.get(`/stock/${productId}`).then((response) => {
        if (response.data.amount < amount) {
          toast.error('Quantidade solicitada fora de estoque');
        } else {
          updatedProducts.map(product => product.id === productId ? product.amount = amount : product.amount = product.amount)
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedProducts))
          setCart(updatedProducts);
        }        
      })      
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
