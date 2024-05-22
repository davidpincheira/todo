import { Component, Input, SimpleChanges, inject, signal } from '@angular/core';
import { Product } from '../../models/product.model';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart.service';
import { RouterLinkActive, RouterLinkWithHref } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLinkWithHref, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  hideSideMenu = signal(true)
  cartService = inject(CartService)
  cart = this.cartService.cart

  toggleSideMenu() {
    this.hideSideMenu.update(prevState =>  !prevState);
  }

  deleteOneProduct(index: number){
    this.cartService.deleteFromCart(index)
  }

  sumOneProduct(product: Product){
    this.cartService.addToCart(product)
  }

  getTotal(){
    return this.cartService.totalPrice()
  }

 
}
