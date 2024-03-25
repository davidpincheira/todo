import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ProductComponent } from '../../components/product/product.component';
import { Product } from '../../../shared/models/product.model';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { CartService } from '../../../shared/services/cart.service';

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [CommonModule, ProductComponent, HeaderComponent],
  templateUrl: './list.component.html',
  styleUrl: './list.component.css'
})
export class ListComponent {

  private cartService = inject(CartService)

  products = signal<Product[]>([])
  //declare a variable called products that is a signal type Product and initialize empty
  //public products = signal([] as Product[])
  constructor(){
    const initProducts: Product[]  = [
      {
        id: Date.now(),
        title: 'Pro 1',
        price: 100,
        image: 'https://picsum.photos/640/640?r=23',
      },
      {
        id: Date.now(),
        title: 'Pro 2',
        price: 100,
        image: 'https://picsum.photos/640/640?r=12',
      },
      {
        id: Date.now(),
        title: 'Pro 3',
        price: 100,
        image: 'https://picsum.photos/640/640?r=1212',
      }
    ];
    this.products.set(initProducts);
  }
  
  addToCart(product: Product){
    this.cartService.addToCart(product)
  }
}
