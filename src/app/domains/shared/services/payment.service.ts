import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

interface OrderDetails {
  id: string;
  orderDate: Date;
  finalPrice: number;
  statusId: number;
  // Otros campos que puedas necesitar
}

interface PaymentData {
  orderId: string;
  paymentMethod: string;
  cardDetails?: {
    cardName: string;
    cardNumber: string;
    expiryDate: string;
    cvv: string;
  } | null;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = "http://localhost:3000/api";
  private http = inject(HttpClient);

  constructor() { }

  getOrderDetails(orderId: string): Observable<OrderDetails> {
    return this.http.get<OrderDetails>(`${this.apiUrl}/orders/${orderId}`);
  }

  processPayment(paymentData: PaymentData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/payments`, paymentData);
  }

  getPaymentStatus(paymentId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/payments/${paymentId}`);
  }
}