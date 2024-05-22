import { CommonModule, Location } from '@angular/common';
import { Component, Input, inject, signal } from '@angular/core';
import { Product } from '@shared/models/product.model';
import { CartService } from '@shared/services/cart.service';
import { ProductService } from '@shared/services/product.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css'
})
export class ProductDetailComponent {
  @Input() id?:string;
  product = signal<Product | null>(null)
  cover = signal('')
  private productService = inject(ProductService)
  private cartService = inject(CartService)
  private location = inject(Location)

  ngOnInit(){
    if(this.id){
      this.productService.getOne(this.id).subscribe({
        next: (res) => {
          res.quantity = 1          
          this.product.set(res)
          if(res.images[0]){
            this.cover.set(res.images[0])
          }
        }
      })
    }
  }

  changeCover(newImg: string){
    this.cover.set(newImg)
  }

  addToCart(product: Product){
    this.cartService.addToCart(product)
  }
  
  goToBack() {
    this.location.back();
  }


}
