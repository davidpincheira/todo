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
  private cartService = inject(CartService)
  cart = this.cartService.cart
  totalPrice = this.cartService.totalPrice  

 /*  @Input() carito: Product[] = []
  totalProducts = signal(0) */

  toggleSideMenu() {
    this.hideSideMenu.update(prevState =>  !prevState);
  }

  deleteOneProduct(product: Product){
    this.cartService.deleteFromCart(product)
  }

  sumOneProduct(product: Product){
    this.cartService.addToCart(product)
    //product.quantity = 1
    /* this.cartService.addToCart(product)
    console.log(this.cart()) */
  }

  /* 
  ngOnchanges(changes: SimpleChanges){
    const carito = changes['cart']
    if(carito) {
      this.totalProducts.set(this.calcTotal())
    }
  }

  calcTotal(){
    return this.carito.reduce((totalProducts, product) => totalProducts + product.price, 0);
  } */

 
}
