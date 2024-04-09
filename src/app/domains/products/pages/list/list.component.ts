import { CommonModule } from '@angular/common';
import { Component, Input, SimpleChanges, inject, signal } from '@angular/core';
import { ProductComponent } from '../../components/product/product.component';
import { Product } from '@shared/models/product.model';
import { HeaderComponent } from '@shared/components/header/header.component';
import { CartService } from '@shared/services/cart.service';
import { ProductService } from '@shared/services/product.service';
import { CategoryService } from '@shared/services/category.service';
import { Category } from '@shared/models/category.model';
import { RouterLinkWithHref } from '@angular/router';

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [CommonModule, ProductComponent, HeaderComponent, RouterLinkWithHref],
  templateUrl: './list.component.html',
  styleUrl: './list.component.css'
})
export class ListComponent {

  private cartService = inject(CartService)
  private productService = inject(ProductService)
  private categoryService = inject(CategoryService)
  @Input() category_id? : string;

  ngOnInit(){
    this.getProducts()
    this.getCategories()
  }

  ngOnChanges(changes: SimpleChanges){
    const category_id = changes['category_id']
    if(category_id){
      this.getProducts()
    }
  }

  products = signal<Product[]>([])
  categories = signal<Category[]>([])
  //declare a variable called products that is a signal type Product and initialize empty
  //public products = signal([] as Product[])
  
  addToCart(product: Product){
    this.cartService.addToCart(product)
  }

  getProducts(){
    this.productService.getProducts(this.category_id).subscribe({
      next: (res)  => {
        const modifiedProducts = res.map(product => {
          return {
            ...product,
            quantity: 1
          };
        });
        this.products.set(modifiedProducts)
      },
      error: (err) => {
        console.error('Error getting products: ', err)
      }
    })
  }
  getCategories(){
    this.categoryService.getAll().subscribe({
      next: (data)  => {
        this.categories.set(data)
      },
      error: (err) => {
        console.error('Error getting categories: ', err)
      }
    })
  }
}
