import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private http = inject(HttpClient)

  constructor() { }

  getProducts(category_id?: string){
    const url = new URL(`http://localhost:3000/api/products`)
    if(category_id){
      url.searchParams.set('category_id', category_id)
    }
    return this.http.get<Product[]>(url.toString())
  }

  getOne(id: string){
    return this.http.get<Product>(`http://localhost:3000/api/products/${id}`)

  }

  getProductsByCategory(categoryId: number){

    return this.http.get<Product[]>(`http://localhost:3000/api/categories/${categoryId}/products`)
  }
}
