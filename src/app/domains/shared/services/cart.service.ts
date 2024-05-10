import { Injectable, computed, signal } from '@angular/core';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  cart = signal<Product[]>([]) //es una señal(signal()) que administra un array ([]) de productos (Product) y se inicializa en vacio (([])) 

  totalPrice() {
    const cart = this.cart();
    return cart.reduce((totalPrice, product) => totalPrice + (product.quantity * product.price), 0);
  }

  constructor() { }

  deleteFromCart(product: Product){   
      const existingItemIndex = this.cart().findIndex(item => item.id === product.id);
      if(existingItemIndex !== -1){
        if(this.cart()[existingItemIndex].quantity === 1){
            // Crear un nuevo array que excluya el producto a eliminar
            const updatedCart = this.cart().filter((item, index) => index !== existingItemIndex);
            // Establecer el nuevo array como el carrito
            this.cart.set(updatedCart);
        } else {
            // Si la cantidad es mayor a 1, simplemente disminuir la cantidad
            this.cart()[existingItemIndex].quantity -= 1;
        }
    }
  }

  addToCart(product: Product){
    if(this.cart().length > 0){
       const existingItemIndex = this.cart().findIndex(item => item.id === product.id );
       if(existingItemIndex != -1){
        //si el producto ya esta en el carrito le sumamos 1
        this.cart()[existingItemIndex].quantity += 1;      
       } else {         
        this.cart.update(state => [...state, product])
       }
    } else {
      //si no hay nada en el carrito lo agrega
      this.cart.update(state => [...state, product])
    }
  }

}
