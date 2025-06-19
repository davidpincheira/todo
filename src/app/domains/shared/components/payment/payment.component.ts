import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RequestStatus } from '@shared/models/request-status.model';
import { PaymentService } from '@shared/services/payment.service';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.css'
})
export class PaymentComponent implements OnInit {
  
  paymentService = inject(PaymentService);
  activatedRoute = inject(ActivatedRoute);
  router = inject(Router);
  formBuilder = inject(FormBuilder);
  
  status: RequestStatus = 'init';
  isSubmitting = false;
  errorMessage = '';
  orderId: string | null = null;
  orderTotal: number = 0;
  
  paymentMethods = [
    { id: 'credit_card', name: 'Tarjeta de Crédito' },
    { id: 'debit_card', name: 'Tarjeta de Débito' },
    { id: 'paypal', name: 'PayPal' },
    { id: 'transfer', name: 'Transferencia Bancaria' }
  ];

  form = this.formBuilder.group({
    paymentMethod: ['', [Validators.required]],
    cardName: ['', []],
    cardNumber: ['', []],
    expiryDate: ['', []],
    cvv: ['', []],
  });

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

    // Dinámica del formulario
    this.form.get('paymentMethod')?.valueChanges.subscribe(method => {
      this.updateFormValidators(method);
    });
  }

  getOrderDetails(orderId: string): void {
    this.status = 'loading';
    
    this.paymentService.getOrderDetails(orderId).subscribe({
      next: (order) => {
        this.orderTotal = order.finalPrice;
        this.status = 'success';
      },
      error: (error) => {
        console.error('Error al obtener detalles de la orden', error);
        this.status = 'failed';
        this.errorMessage = 'No se pudo cargar la información de la orden';
      }
    });
  }

  updateFormValidators(method: string | null): void {
    const cardNameControl = this.form.get('cardName');
    const cardNumberControl = this.form.get('cardNumber');
    const expiryDateControl = this.form.get('expiryDate');
    const cvvControl = this.form.get('cvv');
    
    if (method === 'credit_card' || method === 'debit_card') {
      cardNameControl?.setValidators([Validators.required]);
      cardNumberControl?.setValidators([Validators.required, Validators.pattern(/^\d{16}$/)]);
      expiryDateControl?.setValidators([Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)]);
      cvvControl?.setValidators([Validators.required, Validators.pattern(/^\d{3,4}$/)]);
    } else {
      cardNameControl?.clearValidators();
      cardNumberControl?.clearValidators();
      expiryDateControl?.clearValidators();
      cvvControl?.clearValidators();
    }
    
    cardNameControl?.updateValueAndValidity();
    cardNumberControl?.updateValueAndValidity();
    expiryDateControl?.updateValueAndValidity();
    cvvControl?.updateValueAndValidity();
  }

  processPayment(): void {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      this.errorMessage = 'Por favor, completa todos los campos requeridos';
      return;
    }

    if (!this.orderId) {
      this.errorMessage = 'No se encontró el ID de la orden';
      return;
    }

    this.isSubmitting = true;
    this.status = 'loading';
    this.errorMessage = '';
    
    const paymentData = {
      orderId: this.orderId,
      paymentMethod: this.form.get('paymentMethod')?.value,
      cardDetails: this.form.get('paymentMethod')?.value === 'credit_card' || 
                   this.form.get('paymentMethod')?.value === 'debit_card' ? {
        cardName: this.form.get('cardName')?.value,
        cardNumber: this.form.get('cardNumber')?.value,
        expiryDate: this.form.get('expiryDate')?.value,
        cvv: this.form.get('cvv')?.value
      } : null
    };
    
    /* this.paymentService.processPayment(paymentData).subscribe({
      next: (response) => {
        this.status = 'success';
        this.showSuccessMessage('¡Pago realizado con éxito!');
        this.router.navigate(['/order-confirmation', this.orderId]);
      },
      error: (error) => {
        this.status = 'failed';
        this.isSubmitting = false;
        this.errorMessage = error.message || 'Hubo un error al procesar tu pago. Por favor, inténtalo de nuevo.';
      }
    }); */
  }

  private showSuccessMessage(message: string): void {
    alert(message);
  }
}