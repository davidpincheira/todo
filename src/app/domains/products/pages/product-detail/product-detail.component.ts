import { Component, Input, inject, signal } from '@angular/core';
import { Product } from '@shared/models/product.model';
import { ProductService } from '@shared/services/product.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css'
})
export class ProductDetailComponent {
  @Input() id?:string;
  product = signal<Product | null>(null)
  private productService = inject(ProductService)

  ngOnInit(){
    if(this.id){
      this.productService.getOne(this.id).subscribe({
        next: (res) => {
          console.log(res)
          this.product.set(res)
        }
      })
    }
  }


}
