import { Injectable, computed, signal } from '@angular/core';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  cart = signal<Product[]>([]) //es una señal(signal()) que administra un array ([]) de productos (Product) y se inicializa en vacio (([])) 
  total = computed(()=>{
    const cart = this.cart()
    return cart.reduce((total, product) => total + product.price, 0);
  })

  constructor() { }

  addToCart(product: Product){
    this.cart.update(state => [...state, product])
  }
}
