import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RequestStatus } from '@shared/models/request-status.model';
import { User } from '@shared/models/user.model';
import { CartService } from '@shared/services/cart.service';
import { TokenService } from '@shared/services/token.service';
import { UsersService } from '@shared/services/users.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormsModule], // Agregado FormsModule
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent implements OnInit {

  cartService = inject(CartService);
  userService = inject(UsersService);
  tokenService = inject(TokenService)
  router = inject(Router);
  formBuilder = inject(FormBuilder);
  
  status: RequestStatus = 'init';
  user: User | undefined;
  isSubmitting = false;
  errorMessage = '';

  // Nuevas propiedades para el manejo de envíos
  shippingOptions: boolean = false;
  selectedShipping: string = '';
  shippingCost: number = 0;
  loading: boolean = false;
 
  // Propiedades para verificación de invitados
  showGuestModal: boolean = false;
  pendingOrderDetails: any = null;
  guestToken: string | null = null;
  verificationStep: 'select' | 'verify' = 'select';
  selectedVerificationMethod: 'email' | 'sms' = 'email';
  verificationCode: string = '';
  verificationLoading: boolean = false;
  codeResent: boolean = false;
  
  // Fechas de ejemplo (puedes calcularlas dinámicamente)
  fechaEntregaDomicilio: string = 'lunes 30/06';
  fechaRetiroInicio: string = 'sábado 28/06';
  fechaRetiroFin: string = 'lunes 30/06';

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

    if (this.tokenService.isValidToken()) {
      this.getUser();
    }
    
    // Recuperar datos pendientes si vienes del login
    this.recoveryPendingCheckout();
  }

  selectVerificationMethod(method: 'email' | 'sms') {
    this.selectedVerificationMethod = method;
    this.verificationStep = 'verify';
    this.sendVerificationCode();
  }

  sendVerificationCode() {
    if (!this.selectedVerificationMethod) return;

    this.verificationLoading = true;
    this.codeResent = false;

    const contact = this.selectedVerificationMethod === 'email' 
      ? this.form.get('email')?.value 
      : this.form.get('phone')?.value;

    // Llamada a tu API de verificación
    this.userService.sendVerificationCode({
      method: this.selectedVerificationMethod,
      contact: contact!
    }).subscribe({
      next: (response: any) => {
        this.verificationLoading = false;
        // Aquí puedes manejar la respuesta, por ejemplo guardar un ID de sesión
        console.log('Código enviado:', response);
      },
      error: (error: any) => {
        this.verificationLoading = false;
        this.errorMessage = 'Error al enviar el código de verificación';
        console.error('Error:', error);
      }
    });
  }

  verifyCode() {
    if (!this.verificationCode || this.verificationCode.length < 4) {
      this.errorMessage = 'Por favor, ingresa un código válido';
      return;
    }

    this.verificationLoading = true;
    this.errorMessage = '';

    const contact = this.selectedVerificationMethod === 'email' 
      ? this.form.get('email')?.value 
      : this.form.get('phone')?.value;

    // Llamada a tu API para verificar el código
    this.userService.verifyCode({
      method: this.selectedVerificationMethod,
      contact: contact!,
      code: this.verificationCode
    }).subscribe({
      next: (response: any) => {
        this.verificationLoading = false;
        this.guestToken = response.guestToken || response.token;
        
        // Cerrar modal y procesar la orden
        this.closeGuestModal();
        
        if (this.pendingOrderDetails) {
          this.processOrder(this.pendingOrderDetails);
        }
      },
      error: (error: any) => {
        this.verificationLoading = false;
        this.errorMessage = 'Código incorrecto. Por favor, inténtalo de nuevo.';
        console.error('Error:', error);
      }
    });
  }

  // Reenviar código
  resendCode() {
    this.codeResent = true;
    this.verificationCode = '';
    this.sendVerificationCode();
  }

  // Cerrar modal
  closeGuestModal() {
    this.showGuestModal = false;
    this.verificationStep = 'select';
    this.selectedVerificationMethod = 'email';
    this.verificationCode = '';
    this.pendingOrderDetails = null;
    this.codeResent = false;
    this.errorMessage = '';
  }

  goToLogin() {
    // Guardar datos del formulario en localStorage para recuperarlos después
    const formData = this.form.getRawValue();
    const checkoutData = {
      formData,
      selectedShipping: this.selectedShipping,
      shippingCost: this.shippingCost,
      shippingOptions: this.shippingOptions
    };
    
    localStorage.setItem('pendingCheckout', JSON.stringify(checkoutData));
    this.router.navigate(['/login'], { 
      queryParams: { returnUrl: '/checkout' } 
    });
  }

  getTotal() {
    return this.cartService.totalPrice();
  }

  // Método para obtener el total incluyendo envío
  getTotalWithShipping() {
    const baseTotal = this.getTotal();
    const shipping = this.selectedShipping === 'pickup' ? 0 : this.shippingCost;
    return baseTotal + shipping;
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
  
  /* ------------------------------------------------------------------------------- */
  //1- Método modificado para mostrar las opciones de envío
  /* ------------------------------------------------------------------------------- */
  comprobarPrecioEnvio() {
    const zipCode = this.form.get('zip_code')?.value;
    
    if (!zipCode) {
      return;
    }

    this.loading = true;

    // Tu lógica existente modificada para mostrar opciones
    const timeoutId = setTimeout(() => {
      /* HACER EL LLAMADO A LA API DE CORRE ARGENTINO*/
      this.shippingCost = 15000;
      
      // Mostrar las opciones de envío
      this.shippingOptions = true;
      this.loading = false;
      
      this.calcularFechasEntrega();
    }, 1000);
    
    return timeoutId;
  }

  cambiarCodigoPostal() {
    this.shippingOptions = false;
    this.selectedShipping = '';
    this.shippingCost = 0;
  }

  
  /* onShippingChange() {
    console.log('Opción seleccionada:', this.selectedShipping, this.form);
    // El formulario aparece automáticamente porque selectedShipping ya no está vacío
  } */
 
 /* ------------------------------------------------------------------------------- */
 //PASO 2- Método que se ejecuta cuando cambia la selección de envío
 /* ------------------------------------------------------------------------------- */
  // Método para finalizar el pedido
  continuarConEnvio() {
    const requiredFieldsValid = this.validateRequiredFields();

    if (!requiredFieldsValid) {
      this.form.markAllAsTouched();
      this.errorMessage = 'Por favor, completa todos los campos requeridos';
      return;
    }

    if (this.cartService.cart().length === 0) {
      this.errorMessage = 'Tu carrito está vacío';
      return;
    }
    
    // Preparar los datos de la orden
    const orderDetails = this.prepareOrderDetails();
    
    // Verificar si el usuario está logueado
    if (this.tokenService.isValidToken()) {
      // Usuario logueado - proceder normalmente
      this.processOrder(orderDetails);
    } else {
      // Usuario no logueado - mostrar modal de verificación
      this.pendingOrderDetails = orderDetails;
      this.showGuestModal = true;
      this.verificationStep = 'select';
    }
  }

  private processOrder(orderDetails: any) {
    this.isSubmitting = true;
    this.status = 'loading';
    this.errorMessage = '';

    // Si es usuario invitado, agregar el token temporal
    if (this.guestToken) {
      orderDetails.guestToken = this.guestToken;
    }

    this.cartService.checkout(orderDetails).subscribe({
      next: (response: any) => {
        this.status = 'success';
        this.cartService.clearCart();
        
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

  private prepareOrderDetails() {
    const formData = this.form.getRawValue();
    
    return {
      orderDate: new Date(),
      deliveryAddress: formData.address,
      city: formData.city,
      email: formData.email,
      name: formData.name,
      phone: formData.phone,
      province: formData.province,
      zip_code: formData.zip_code,
      totalPrice: this.getTotal(),
      finalPrice: this.getTotalWithShipping(),
      statusId: 1,
      active: 1,
      userId: this.user?.id,
      orderItems: this.cartService.cart(),
      shippingType: this.selectedShipping,
      shippingCost: this.selectedShipping === 'pickup' ? 0 : this.shippingCost
    };
  }

  // Método para validar campos requeridos según el tipo de envío
  validateRequiredFields(): boolean {
    const name = this.form.get('name')?.value;
    const email = this.form.get('email')?.value;
    const phone = this.form.get('phone')?.value;
    
    // Campos básicos siempre requeridos
    if (!name || !email || !phone) {
      return false;
    }

    // Para envío a domicilio, validar campos adicionales
    if (this.selectedShipping === 'home_delivery') {
      const address = this.form.get('address')?.value;
      const city = this.form.get('city')?.value;
      const province = this.form.get('province')?.value;
      
      if (!address || !city || !province) {
        return false;
      }
    }

    // Validar formato de email
    const emailControl = this.form.get('email');
    if (emailControl?.hasError('email')) {
      return false;
    }

    return true;
  }

  // Método auxiliar para calcular fechas
  private calcularFechasEntrega() {
    const today = new Date();
    
    // Ejemplo: entrega a domicilio en 3 días hábiles
    const deliveryDate = new Date(today);
    deliveryDate.setDate(today.getDate() + 3);
    this.fechaEntregaDomicilio = this.formatearFecha(deliveryDate);
    
    // Ejemplo: retiro disponible desde mañana
    const pickupStart = new Date(today);
    pickupStart.setDate(today.getDate() + 1);
    this.fechaRetiroInicio = this.formatearFecha(pickupStart);
    
    const pickupEnd = new Date(today);
    pickupEnd.setDate(today.getDate() + 4);
    this.fechaRetiroFin = this.formatearFecha(pickupEnd);
  }

  private formatearFecha(fecha: Date): string {
    const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const meses = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    
    const dia = dias[fecha.getDay()];
    const diaNum = fecha.getDate().toString().padStart(2, '0');
    const mes = meses[fecha.getMonth()];
    
    return `${dia} ${diaNum}/${mes}`;
  }

  // Método para recuperar datos guardados (llamar en ngOnInit si vienes del login)
  private recoveryPendingCheckout() {
    const savedData = localStorage.getItem('pendingCheckout');
    if (savedData) {
      try {
        const checkoutData = JSON.parse(savedData);
        this.form.patchValue(checkoutData.formData);
        this.selectedShipping = checkoutData.selectedShipping;
        this.shippingCost = checkoutData.shippingCost;
        this.shippingOptions = checkoutData.shippingOptions;
        
        // Limpiar datos guardados
        localStorage.removeItem('pendingCheckout');
      } catch (error) {
        console.error('Error al recuperar datos del checkout:', error);
      }
    }
  }

}