import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RequestStatus } from '@shared/models/request-status.model';
import { User } from '@shared/models/user.model';
import { CartService } from '@shared/services/cart.service';
import { UsersService } from '@shared/services/users.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent implements OnInit {

  cartService = inject(CartService);
  userService = inject(UsersService);
  router = inject(Router);
  formBuilder = inject(FormBuilder);
  
  status: RequestStatus = 'init';
  user: User | undefined;
  isSubmitting = false;
  errorMessage = '';

  form = this.formBuilder.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.email, Validators.required]],
    address: ['', [Validators.required, Validators.minLength(6)]],
    city: ['', [Validators.required]],    
    zip_code: ['', [Validators.required]],    
    province: ['', [Validators.required]],    
    phone: ['', [Validators.required, Validators.minLength(6)]],    
  });

  ngOnInit(): void {
    // Cargar los datos del usuario al iniciar el componente
    this.getUser();
  }

  getTotal() {
    return this.cartService.totalPrice();
  }

  getUser() {
    this.status = 'loading';
    
    this.userService.getUser().subscribe({
      next: (data: User) => {
        this.user = data;
        // Pre-rellenar el formulario con los datos del usuario
        if (this.user) {
          this.form.patchValue({
            name: this.user.name || '',
            email: this.user.email || '',
            // Otros campos si están disponibles en el usuario
          });
        }
        this.status = 'success';
      },
      error: (error) => {
        console.error('Error al obtener el perfil de usuario', error);
        this.status = 'failed';
        this.errorMessage = 'No se pudo cargar la información del usuario';
      }
    });
  }

  checkout() {
    //debugger //TODO
    /* if (!this.form.valid) {
      this.form.markAllAsTouched();
      this.errorMessage = 'Por favor, completa todos los campos requeridos';
      return;
    }
    
    if (this.cartService.cart().length === 0) {
      this.errorMessage = 'Tu carrito está vacío';
      return;
    } */

    this.isSubmitting = true;
    this.status = 'loading';
    this.errorMessage = '';
    
    const formData = this.form.getRawValue();

    const orderDetails = {
      orderDate: new Date(),
      deliveryAddress: formData.address,
      city: formData.city,
      email: formData.email,
      name: formData.name,
      phone: formData.phone,
      province: formData.province,
      zip_code: formData.zip_code,
      totalPrice: this.getTotal(),
      finalPrice: this.getTotal(),
      statusId: 1,
      active: 1,
      user: this.user?.id,
      orderItems: this.cartService.cart()
    };

    console.log(orderDetails)
    
    this.cartService.checkout(orderDetails).subscribe({
      next: (response: any) => {
        this.status = 'success';
        this.cartService.clearCart(); // Limpiar el carrito después de un checkout exitoso
        
        // Redirigir a la página de pago con el ID de la orden
        const orderId = response.id || response.orderId;
        this.router.navigate(['/payment', orderId]);
      },
      error: (error: any) => {
        this.status = 'failed';
        this.isSubmitting = false;
        this.errorMessage = error.message || 'Hubo un error al procesar tu pedido. Por favor, inténtalo de nuevo.';
      }
    });
  }
}