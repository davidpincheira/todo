import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RequestStatus } from '@shared/models/request-status.model';
import { User } from '@shared/models/user.model';
import { CartService } from '@shared/services/cart.service';
import { ShippingService } from '@shared/services/shipping.service';
import { TokenService } from '@shared/services/token.service';
import { UsersService } from '@shared/services/users.service';

// Agrega la interfaz Product extendida con weight opcional
interface Product {
  id: number;
  name: string;
  price: number;
  quantity: number;
  // otras propiedades existentes...
  weight?: number; // Peso opcional en kg
}

// Interfaces para el sistema de envíos
interface ShippingOption {
  id: string;
  carrier: string;
  service: string;
  price: number;
  delivery: string;
  reliability: string;
  logo?: string;
  description?: string;
}

interface ShippingCalculationRequest {
  origin: string;
  destination: string;
  weight: number;
  value: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
}

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
  //private shippingService = inject(ShippingService); // Si usas el servicio opcional

  
  status: RequestStatus = 'init';
  user: User | undefined;
  isSubmitting = false;
  errorMessage = '';

  // ============================================================================
  // PROPIEDADES MEJORADAS PARA SISTEMA MULTI-CARRIER
  // ============================================================================
  
  // Sistema de envíos mejorado
  shippingOptions: ShippingOption[] = [];
  selectedShipping: ShippingOption | null = null;
  showShippingOptions: boolean = false;
  shippingCalculating: boolean = false;
  shippingError: string = '';
  
  // Configuración de origen (puedes hacer esto dinámico)
  availableOrigins = [
    { code: '1001', name: 'CABA (1001)', city: 'Buenos Aires' },
    { code: '1602', name: 'Munro, Buenos Aires (1602)', city: 'Munro' },
    { code: '2000', name: 'Rosario, Santa Fe (2000)', city: 'Rosario' },
    { code: '5000', name: 'Córdoba Capital (5000)', city: 'Córdoba' }
  ];
  
  selectedOrigin: string = '1001'; // Valor por defecto
  
  // Propiedades existentes mantenidas
  loading: boolean = false;
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
    zip_code: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],    
    province: ['', [Validators.required]],    
    phone: ['', [Validators.required, Validators.minLength(6)]],    
  });

  ngOnInit(): void {
    if (this.tokenService.isValidToken()) {
      this.getUser();
    }
    
    // Recuperar datos pendientes si vienes del login
    this.recoveryPendingCheckout();
    
    // Configurar listener para cambios en código postal
    this.setupZipCodeListener();
  }

  // ============================================================================
  // NUEVO SISTEMA DE CÁLCULO DE ENVÍOS MULTI-CARRIER
  // ============================================================================

  private setupZipCodeListener(): void {
    this.form.get('zip_code')?.valueChanges.subscribe(zipCode => {
      if (zipCode && zipCode.length === 4) {
        // Delay para evitar múltiples llamadas mientras escribe
        setTimeout(() => {
          if (this.form.get('zip_code')?.value === zipCode) {
            this.calculateAllShippingOptions();
          }
        }, 500);
      } else {
        this.clearShippingOptions();
      }
    });
  }

  async calculateAllShippingOptions(): Promise<void> {
    const zipCode = this.form.get('zip_code')?.value;
    
    if (!zipCode || zipCode.length !== 4) {
      return;
    }

    this.shippingCalculating = true;
    this.showShippingOptions = false;
    this.shippingError = '';
    this.selectedShipping = null;

    try {
      // Preparar datos para el cálculo
      const calculationRequest: ShippingCalculationRequest = {
        origin: this.selectedOrigin,
        destination: zipCode,
        weight: this.calculateTotalWeight(),
        value: this.getTotal(),
        dimensions: this.calculateTotalDimensions()
      };

      // Simular llamada a APIs (reemplaza con llamadas reales)
      const options = await this.fetchShippingRates(calculationRequest);
      
      this.shippingOptions = options;
      this.showShippingOptions = options.length > 0;
      
      if (options.length === 0) {
        this.shippingError = 'No se encontraron opciones de envío para este código postal.';
      }

      this.calcularFechasEntrega();

    } catch (error) {
      console.error('Error calculando opciones de envío:', error);
      this.shippingError = 'Error al calcular opciones de envío. Por favor, inténtalo nuevamente.';
    } finally {
      this.shippingCalculating = false;
    }
  }

  private async fetchShippingRates(request: ShippingCalculationRequest): Promise<ShippingOption[]> {
    // Simular delay de API
    await this.delay(1500);
    
    // Calcular tarifas basadas en distancia y peso
    const distance = Math.abs(parseInt(request.origin) - parseInt(request.destination));
    const baseRate = 1200 + (distance * 2);
    const weightSurcharge = Math.max(0, request.weight - 1) * 300;
    const totalBase = baseRate + weightSurcharge;

    // Generar opciones de diferentes carriers
    const options: ShippingOption[] = [
      {
        id: 'correo-clasico',
        carrier: 'Correo Argentino',
        service: 'Clásico',
        price: Math.round(totalBase * 0.75),
        delivery: '3-6 días hábiles',
        reliability: 'Económico',
        description: 'Opción más económica con seguimiento básico'
      },
      {
        id: 'correo-express',
        carrier: 'Correo Argentino',
        service: 'Express',
        price: Math.round(totalBase * 0.95),
        delivery: '2-4 días hábiles',
        reliability: 'Rápido',
        description: 'Entrega más rápida con seguimiento completo'
      },
      {
        id: 'oca-standard',
        carrier: 'OCA',
        service: 'Estándar',
        price: Math.round(totalBase),
        delivery: '2-4 días hábiles',
        reliability: 'Confiable',
        description: 'Servicio confiable con amplia cobertura'
      },
      {
        id: 'oca-express',
        carrier: 'OCA',
        service: 'Express',
        price: Math.round(totalBase * 1.35),
        delivery: '24-48 horas',
        reliability: 'Express',
        description: 'Entrega ultra rápida para pedidos urgentes'
      },
      {
        id: 'andreani-standard',
        carrier: 'Andreani',
        service: 'Estándar',
        price: Math.round(totalBase * 1.15),
        delivery: '1-3 días hábiles',
        reliability: 'Premium',
        description: 'Servicio premium con excelente tracking'
      }
    ];

    // Filtrar opciones disponibles según el destino
    return options
      .filter(option => this.isOptionAvailableForDestination(option, request.destination))
      .sort((a, b) => a.price - b.price);

    /*
    try {
    // Si tienes el servicio de shipping configurado
    if (environment.shipping.useRealAPIs) {
      const rates = await this.shippingService.getAllShippingRates(request).toPromise();
      return rates || [];
    }
    
    // Fallback a simulación (el código actual)
    await this.delay(1500);
    // ... resto del código actual
  } catch (error) {
    console.error('Error fetching shipping rates:', error);
    return this.getSimulatedRates(request);
  } 
     */
  }

  private isOptionAvailableForDestination(option: ShippingOption, destination: string): boolean {
    const zipCode = parseInt(destination);
    
    // Lógica de disponibilidad por zona
    if (zipCode >= 1000 && zipCode <= 1999) {
      // AMBA - todas las opciones disponibles
      return true;
    } else if (zipCode >= 2000 && zipCode <= 3999) {
      // Interior cercano - excluir express muy rápido
      return option.id !== 'oca-express';
    } else if (zipCode >= 4000 && zipCode <= 5999) {
      // Interior lejano - solo opciones estándar
      return !option.id.includes('express');
    } else {
      // Patagonia - solo Correo Argentino y OCA estándar
      return option.carrier === 'Correo Argentino' || option.id === 'oca-standard';
    }
  }

  selectShippingOption(option: ShippingOption): void {
    this.selectedShipping = option;
    this.errorMessage = ''; // Limpiar errores previos
  }

  changeOrigin(): void {
    if (this.form.get('zip_code')?.value) {
      this.calculateAllShippingOptions();
    }
  }

  clearShippingOptions(): void {
    this.showShippingOptions = false;
    this.shippingOptions = [];
    this.selectedShipping = null;
    this.shippingError = '';
  }

  // ============================================================================
  // MÉTODOS AUXILIARES PARA CÁLCULOS
  // ============================================================================

  private calculateTotalWeight(): number {
    // Calcular peso total basado en items del carrito
    const cart: Product[] = this.cartService.cart();
    let totalWeight = 0;
    
    cart.forEach(item => {
      // Asumiendo que cada item tiene un peso por defecto o definido
      const itemWeight = item.weight || 0.5; // 500g por defecto
      totalWeight += itemWeight * item.quantity;
    });
    
    return Math.max(totalWeight, 0.1); // Mínimo 100g
  }

  private calculateTotalDimensions() {
    // Dimensiones estimadas basadas en número de items
    const itemCount = this.cartService.cart().reduce((sum, item) => sum + item.quantity, 0);
    
    return {
      length: Math.min(20 + (itemCount * 5), 50), // Max 50cm
      width: Math.min(15 + (itemCount * 3), 40),  // Max 40cm
      height: Math.min(10 + (itemCount * 2), 30)  // Max 30cm
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ============================================================================
  // MÉTODOS DE TOTALES ACTUALIZADOS
  // ============================================================================

  getTotal(): number {
    return this.cartService.totalPrice();
  }

  getTotalWithShipping(): number {
    const baseTotal = this.getTotal();
    const shippingCost = this.selectedShipping?.price || 0;
    return baseTotal + shippingCost;
  }

  getShippingCost(): number {
    return this.selectedShipping?.price || 0;
  }

  // ============================================================================
  // MÉTODO PRINCIPAL DE CHECKOUT ACTUALIZADO
  // ============================================================================

  continuarConEnvio(): void {
    // Validar que hay una opción de envío seleccionada
    if (!this.selectedShipping) {
      this.errorMessage = 'Por favor, selecciona una opción de envío';
      return;
    }

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
      this.processOrder(orderDetails);

      
    } else {
      this.pendingOrderDetails = orderDetails;
      this.showGuestModal = true;
      this.verificationStep = 'select';
    }
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
      
      // Información de envío mejorada
      shippingType: this.selectedShipping?.id,
      shippingCarrier: this.selectedShipping?.carrier,
      shippingService: this.selectedShipping?.service,
      shippingCost: this.selectedShipping?.price || 0,
      shippingOrigin: this.selectedOrigin,
      estimatedDelivery: this.selectedShipping?.delivery,
      
      // Información adicional para tracking
      shippingDetails: {
        option: this.selectedShipping,
        weight: this.calculateTotalWeight(),
        dimensions: this.calculateTotalDimensions()
      }
    };
  }

  // ============================================================================
  // MÉTODOS EXISTENTES MANTENIDOS (sin cambios importantes)
  // ============================================================================

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

    this.userService.sendVerificationCode({
      method: this.selectedVerificationMethod,
      contact: contact!
    }).subscribe({
      next: (response: any) => {
        this.verificationLoading = false;
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

    this.userService.verifyCode({
      method: this.selectedVerificationMethod,
      contact: contact!,
      code: this.verificationCode
    }).subscribe({
      next: (response: any) => {
        this.verificationLoading = false;
        this.guestToken = response.guestToken || response.token;
        
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

  resendCode() {
    this.codeResent = true;
    this.verificationCode = '';
    this.sendVerificationCode();
  }

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
    const formData = this.form.getRawValue();
    const checkoutData = {
      formData,
      selectedShipping: this.selectedShipping,
      showShippingOptions: this.showShippingOptions,
      shippingOptions: this.shippingOptions,
      selectedOrigin: this.selectedOrigin
    };
    
    localStorage.setItem('pendingCheckout', JSON.stringify(checkoutData));
    this.router.navigate(['/login'], { 
      queryParams: { returnUrl: '/checkout' } 
    });
  }

  getUser() {
    this.status = 'loading';
    
    this.userService.getUser().subscribe({
      next: (data: User) => {
        this.user = data;
        if (this.user) {
          this.form.patchValue({
            name: this.user.name || '',
            email: this.user.email || '',
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

  private processOrder(orderDetails: any) {
    this.isSubmitting = true;
    this.status = 'loading';
    this.errorMessage = '';

    console.log('Procesando pedido:', orderDetails);

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

  private validateRequiredFields(): boolean {
    const name = this.form.get('name')?.value;
    const email = this.form.get('email')?.value;
    const phone = this.form.get('phone')?.value;
    const address = this.form.get('address')?.value;
    const city = this.form.get('city')?.value;
    const province = this.form.get('province')?.value;
    const zipCode = this.form.get('zip_code')?.value;
    
    // Todos los campos son requeridos para envío
    if (!name || !email || !phone || !address || !city || !province || !zipCode) {
      return false;
    }

    // Validar formato de email
    const emailControl = this.form.get('email');
    if (emailControl?.hasError('email')) {
      return false;
    }

    return true;
  }

  private calcularFechasEntrega() {
    const today = new Date();
    
    if (this.selectedShipping) {
      // Calcular basado en el tiempo de entrega seleccionado
      let daysToAdd = 3; // Por defecto
      
      if (this.selectedShipping.delivery.includes('24-48')) {
        daysToAdd = 2;
      } else if (this.selectedShipping.delivery.includes('1-3')) {
        daysToAdd = 3;
      } else if (this.selectedShipping.delivery.includes('3-6')) {
        daysToAdd = 4;
      }
      
      const deliveryDate = new Date(today);
      deliveryDate.setDate(today.getDate() + daysToAdd);
      this.fechaEntregaDomicilio = this.formatearFecha(deliveryDate);
    }
    
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

  private recoveryPendingCheckout() {
    const savedData = localStorage.getItem('pendingCheckout');
    if (savedData) {
      try {
        const checkoutData = JSON.parse(savedData);
        this.form.patchValue(checkoutData.formData);
        this.selectedShipping = checkoutData.selectedShipping;
        this.showShippingOptions = checkoutData.showShippingOptions || false;
        this.shippingOptions = checkoutData.shippingOptions || [];
        this.selectedOrigin = checkoutData.selectedOrigin || '1001';
        
        localStorage.removeItem('pendingCheckout');
      } catch (error) {
        console.error('Error al recuperar datos del checkout:', error);
      }
    }
  }

  // ============================================================================
  // MÉTODOS OBSOLETOS REMOVIDOS/REEMPLAZADOS
  // ============================================================================
  
  // El método comprobarPrecioEnvio() es reemplazado por calculateAllShippingOptions()
  // El método cambiarCodigoPostal() es reemplazado por clearShippingOptions()
}
