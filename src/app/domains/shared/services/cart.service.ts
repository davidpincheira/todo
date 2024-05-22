import { Injectable, computed, signal } from '@angular/core';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  cart = signal<Product[]>([]) //es una señal(signal()) que administra un array ([]) de productos (Product) y se inicializa en vacio (([])) 

  constructor() { }

  totalItems = computed( () => this.cart().length)
  totalPrice = computed( () => {
    return this.cart().reduce((total: number, product: Product) => total + (product.quantity * product.price), 0);
  })

  deleteFromCart(index: number){
    this.cart.update(state => {
      const existingItemIndex = state.findIndex(item => item.id === index);
      if (existingItemIndex !== -1) {
        const product = state[existingItemIndex];
        if (product.quantity > 1) {
          // Decrement the quantity of the product
          return state.map((item, i) =>
            i === existingItemIndex ? { ...item, quantity: item.quantity - 1 } : item
          );
        } else {
          // Remove the product from the cart
          return state.filter((_, i) => i !== existingItemIndex);
        }
      }
      return state;
    });
  }

  addToCart(product: Product){
    this.cart.update(state => {
      const existingItemIndex = state.findIndex(item => item.id === product.id);
      if (existingItemIndex !== -1) {
        // Increment the quantity of the existing product
        return state.map((item, i) =>
          i === existingItemIndex ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        // Add the new product to the cart
        return [...state, product];
      }
    });
  }

}
