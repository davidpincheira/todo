import { Component, Input, inject } from '@angular/core';
import { Product } from '../../../shared/models/product.model';
import { CommonModule } from '@angular/common';
import { RouterLinkWithHref } from '@angular/router';
import { CartService } from '@shared/services/cart.service';

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [CommonModule, RouterLinkWithHref],
  templateUrl: './product.component.html',
  styleUrl: './product.component.css'
})
export class ProductComponent {
  @Input({required: true}) product !: Product ;

  cartService = inject(CartService)

  addToCartHandler(){
    this.cartService.addToCart(this.product)
  }
}
