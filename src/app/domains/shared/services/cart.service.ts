import { Injectable, computed, inject, signal } from '@angular/core';
import { Product } from '../models/product.model';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  apiUrl = "http://localhost:3000/api";
  private readonly CART_STORAGE_KEY = 'shopping_cart';

  private http = inject(HttpClient);

  // Inicializa la señal con los datos del localStorage si existen
  cart = signal<Product[]>(this.getCartFromStorage());

  constructor() { }

  // Obtiene el carrito desde localStorage
  private getCartFromStorage(): Product[] {
    const storedCart = localStorage.getItem(this.CART_STORAGE_KEY);
    if (storedCart) {
      try {
        return JSON.parse(storedCart);
      } catch (e) {
        console.error('Error al cargar el carrito desde localStorage:', e);
        return [];
      }
    }
    return [];
  }

  // Guarda el carrito en localStorage
  private saveCartToStorage(cartItems: Product[]): void {
    localStorage.setItem(this.CART_STORAGE_KEY, JSON.stringify(cartItems));
  }

  totalItems = computed(() => this.cart().length);
  
  totalPrice = computed(() => {
    const total = this.cart().reduce((total: number, product: Product) => total + (product.quantity * product.price), 0);
    return total;
  });

  deleteFromCart(index: number) {
    this.cart.update(state => {
      const existingItemIndex = state.findIndex(item => item.id === index);
      let newState = [...state];
      
      if (existingItemIndex !== -1) {
        const product = state[existingItemIndex];
        if (product.quantity > 1) {
          // Decrementar la cantidad del producto
          newState = state.map((item, i) =>
            i === existingItemIndex ? { ...item, quantity: item.quantity - 1 } : item
          );
        } else {
          // Eliminar el producto del carrito
          newState = state.filter((_, i) => i !== existingItemIndex);
        }
      }
      
      // Guardar el carrito actualizado en localStorage
      this.saveCartToStorage(newState);
      
      return newState;
    });
  }

  addToCart(product: Product) {
    this.cart.update(state => {
      const existingItemIndex = state.findIndex(item => item.id === product.id);
      let newState: Product[];
      
      if (existingItemIndex !== -1) {
        // Incrementar la cantidad del producto existente
        newState = state.map((item, i) =>
          i === existingItemIndex ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        // Añadir el nuevo producto al carrito con cantidad inicial
        const productWithQuantity = { 
          ...product, 
          quantity: product.quantity ? product.quantity : 1 
        };
        newState = [...state, productWithQuantity];
      }
      
      // Guardar el carrito actualizado en localStorage
      this.saveCartToStorage(newState);
      
      return newState;
    });
  }

  clearCart() {
    this.cart.set([]);
    localStorage.removeItem(this.CART_STORAGE_KEY);
  }

  checkout(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/checkout`, data);
  }
}