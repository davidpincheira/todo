import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Product } from '../../../shared/models/product.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product.component.html',
  styleUrl: './product.component.css'
})
export class ProductComponent {
  @Input({required: true}) product !: Product ;

  @Output() addToCartClicked = new EventEmitter();

  addToCartHandler(){
    console.log("click from child")
    this.addToCartClicked.emit("mensaje desde el hijo"+ this.product.title);
  }
}
