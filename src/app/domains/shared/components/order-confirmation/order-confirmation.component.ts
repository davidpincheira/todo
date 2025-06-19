import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RequestStatus } from '@shared/models/request-status.model';
import { PaymentService } from '@shared/services/payment.service';

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-confirmation.component.html',
  styleUrl: './order-confirmation.component.css'
})
export class OrderConfirmationComponent implements OnInit {
  
  paymentService = inject(PaymentService);
  activatedRoute = inject(ActivatedRoute);
  router = inject(Router);
  
  status: RequestStatus = 'init';
  errorMessage = '';
  orderId: string | null = null;
  orderDetails: any = null;
  
  ngOnInit(): void {
    // Obtener el ID de la orden de la URL
    this.activatedRoute.paramMap.subscribe(params => {
      this.orderId = params.get('orderId');
      
      if (this.orderId) {
        this.getOrderDetails(this.orderId);
      } else {
        this.errorMessage = 'No se encontró el ID de la orden';
        this.router.navigate(['/products']);
      }
    });
  }

  getOrderDetails(orderId: string): void {
    this.status = 'loading';
    
    this.paymentService.getOrderDetails(orderId).subscribe({
      next: (order) => {
        this.orderDetails = order;
        this.status = 'success';
      },
      error: (error) => {
        console.error('Error al obtener detalles de la orden', error);
        this.status = 'failed';
        this.errorMessage = 'No se pudo cargar la información de la orden';
      }
    });
  }

  continueShopping(): void {
    this.router.navigate(['/products']);
  }
}