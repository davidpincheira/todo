// shipping.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, forkJoin, of, throwError } from 'rxjs';
import { map, catchError, timeout } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface ShippingRate {
  id: string;
  carrier: string;
  service: string;
  price: number;
  delivery: string;
  reliability: string;
  description?: string;
}

export interface ShippingRequest {
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

@Injectable({
  providedIn: 'root'
})
export class ShippingService {

  private readonly API_TIMEOUT = 10000; // 10 segundos

  constructor(private http: HttpClient) {}

  /**
   * Método principal para obtener tarifas de múltiples carriers
   */
  getAllShippingRates(request: ShippingRequest): Observable<ShippingRate[]> {
    // Crear array de observables para cada carrier
    const carriers$ = [
      this.getCorreoArgentinoRates(request),
      this.getOCARates(request),
      this.getAndreaniRates(request)
    ];

    // Ejecutar todas las consultas en paralelo
    return forkJoin(carriers$).pipe(
      map(results => {
        // Combinar todos los resultados y filtrar errores
        const allRates: ShippingRate[] = [];
        results.forEach(carrierRates => {
          if (Array.isArray(carrierRates)) {
            allRates.push(...carrierRates);
          }
        });
        
        // Ordenar por precio
        return allRates.sort((a, b) => a.price - b.price);
      }),
      catchError(error => {
        console.error('Error getting shipping rates:', error);
        // Devolver tarifas fallback si fallan todas las APIs
        return of(this.getFallbackRates(request));
      })
    );
  }

  /**
   * Obtener tarifas de Correo Argentino
   */
  private getCorreoArgentinoRates(request: ShippingRequest): Observable<ShippingRate[]> {
    // Si tienes acceso a la API de Correo Argentino
    if (environment.shipping.correoArgentino?.apiUrl && environment.shipping.correoArgentino?.apiKey) {
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${environment.shipping.correoArgentino.apiKey}`,
        'Content-Type': 'application/json'
      });

      const body = {
        origen: request.origin,
        destino: request.destination,
        peso: request.weight,
        valorDeclarado: request.value,
        ...request.dimensions
      };

      return this.http.post<any>(`${environment.shipping.correoArgentino.apiUrl}/cotizar`, body, { headers })
        .pipe(
          timeout(this.API_TIMEOUT),
          map(response => this.parseCorreoArgentinoResponse(response)),
          catchError(error => {
            console.error('Correo Argentino API error:', error);
            return of(this.getCorreoArgentinoFallback(request));
          })
        );
    }

    // Fallback con tarifas estimadas
    return of(this.getCorreoArgentinoFallback(request));
  }

  /**
   * Obtener tarifas de OCA
   */
  private getOCARates(request: ShippingRequest): Observable<ShippingRate[]> {
    // Si tienes acceso a la API de OCA
    if (environment.shipping.oca?.apiUrl && environment.shipping.oca?.apiKey) {
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${environment.shipping.oca.apiKey}`,
        'Content-Type': 'application/json'
      });

      const body = {
        origen: request.origin,
        destino: request.destination,
        peso: request.weight,
        valorDeclarado: request.value
      };

      return this.http.post<any>(`${environment.shipping.oca.apiUrl}/tarifas`, body, { headers })
        .pipe(
          timeout(this.API_TIMEOUT),
          map(response => this.parseOCAResponse(response)),
          catchError(error => {
            console.error('OCA API error:', error);
            return of(this.getOCAFallback(request));
          })
        );
    }

    // Fallback con tarifas estimadas
    return of(this.getOCAFallback(request));
  }

  /**
   * Obtener tarifas de Andreani
   */
  private getAndreaniRates(request: ShippingRequest): Observable<ShippingRate[]> {
    // Si tienes acceso a la API de Andreani
    if (environment.shipping.andreani?.apiUrl && environment.shipping.andreani?.credentials) {
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${environment.shipping.andreani.credentials}`,
        'Content-Type': 'application/json'
      });

      const body = {
        cpOrigen: request.origin,
        cpDestino: request.destination,
        peso: request.weight,
        valorDeclarado: request.value,
        volumen: this.calculateVolume(request.dimensions)
      };

      return this.http.post<any>(`${environment.shipping.andreani.apiUrl}/v2/tarifas`, body, { headers })
        .pipe(
          timeout(this.API_TIMEOUT),
          map(response => this.parseAndreaniResponse(response)),
          catchError(error => {
            console.error('Andreani API error:', error);
            return of(this.getAndreaniFallback(request));
          })
        );
    }

    // Fallback con tarifas estimadas
    return of(this.getAndreaniFallback(request));
  }

  /**
   * Usar servicio tercerizado como Envia.com
   */
  getThirdPartyRates(request: ShippingRequest): Observable<ShippingRate[]> {
    // Selecciona el proveedor de terceros, por ejemplo 'envia'
    // Select the provider, e.g., 'envia'
    const providerKey = 'envia'; // or 'rapidapi', depending on your logic
    const thirdPartyProvider = environment.shipping.thirdPartyShipping[providerKey];

    if (!thirdPartyProvider?.apiUrl || !thirdPartyProvider?.apiKey) {
      return throwError(() => new Error('Third party shipping service not configured'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${thirdPartyProvider.apiKey}`,
      'Content-Type': 'application/json'
    });

    const body = {
      origin: {
        country_code: 'AR',
        postal_code: request.origin
      },
      destination: {
        country_code: 'AR',
        postal_code: request.destination
      },
      packages: [{
        weight: request.weight,
        dimensions: request.dimensions,
        declared_value: request.value
      }],
      carriers: ['andreani', 'oca', 'correo-argentino']
    };

    return this.http.post<any>(`${thirdPartyProvider.apiUrl}/rate`, body, { headers })
      .pipe(
        timeout(this.API_TIMEOUT),
        map(response => this.parseThirdPartyResponse(response)),
        catchError(error => {
          console.error('Third party API error:', error);
          return of(this.getFallbackRates(request));
        })
      );
  }

  // ============================================================================
  // MÉTODOS DE PARSING DE RESPUESTAS
  // ============================================================================

  private parseCorreoArgentinoResponse(response: any): ShippingRate[] {
    if (!response.tarifas || !Array.isArray(response.tarifas)) {
      return [];
    }

    return response.tarifas.map((tarifa: any) => ({
      id: `correo-${tarifa.servicio.toLowerCase().replace(/\s+/g, '-')}`,
      carrier: 'Correo Argentino',
      service: tarifa.servicio,
      price: tarifa.precio,
      delivery: tarifa.tiempoEntrega || '3-6 días hábiles',
      reliability: tarifa.servicio.includes('Express') ? 'Rápido' : 'Económico',
      description: tarifa.descripcion
    }));
  }

  private parseOCAResponse(response: any): ShippingRate[] {
    if (!response.tarifas || !Array.isArray(response.tarifas)) {
      return [];
    }

    return response.tarifas.map((tarifa: any) => ({
      id: `oca-${tarifa.tipo.toLowerCase().replace(/\s+/g, '-')}`,
      carrier: 'OCA',
      service: tarifa.tipo,
      price: tarifa.precio,
      delivery: tarifa.tiempoEntrega || '2-4 días hábiles',
      reliability: tarifa.tipo.includes('Express') ? 'Express' : 'Confiable',
      description: tarifa.descripcion
    }));
  }

  private parseAndreaniResponse(response: any): ShippingRate[] {
    if (!response.tarifas || !Array.isArray(response.tarifas)) {
      return [];
    }

    return response.tarifas.map((tarifa: any) => ({
      id: `andreani-${tarifa.servicio.toLowerCase().replace(/\s+/g, '-')}`,
      carrier: 'Andreani',
      service: tarifa.servicio,
      price: tarifa.precio,
      delivery: tarifa.tiempoEntrega || '1-3 días hábiles',
      reliability: 'Premium',
      description: tarifa.descripcion
    }));
  }

  private parseThirdPartyResponse(response: any): ShippingRate[] {
    if (!response.rates || !Array.isArray(response.rates)) {
      return [];
    }

    return response.rates.map((rate: any) => ({
      id: rate.carrier_id + '-' + rate.service_id,
      carrier: rate.carrier_name,
      service: rate.service_name,
      price: rate.total_pricing,
      delivery: rate.delivery_estimate,
      reliability: this.getReliabilityFromCarrier(rate.carrier_name),
      description: rate.description
    }));
  }

  // ============================================================================
  // MÉTODOS FALLBACK (TARIFAS ESTIMADAS)
  // ============================================================================

  private getFallbackRates(request: ShippingRequest): ShippingRate[] {
    const baseRate = this.calculateBaseRate(request);
    
    return [
      ...this.getCorreoArgentinoFallback(request),
      ...this.getOCAFallback(request),
      ...this.getAndreaniFallback(request)
    ].sort((a, b) => a.price - b.price);
  }

  private getCorreoArgentinoFallback(request: ShippingRequest): ShippingRate[] {
    const baseRate = this.calculateBaseRate(request);
    
    return [
      {
        id: 'correo-clasico',
        carrier: 'Correo Argentino',
        service: 'Clásico',
        price: Math.round(baseRate * 0.75),
        delivery: '3-6 días hábiles',
        reliability: 'Económico',
        description: 'Opción más económica con seguimiento básico'
      },
      {
        id: 'correo-express',
        carrier: 'Correo Argentino',
        service: 'Express',
        price: Math.round(baseRate * 0.95),
        delivery: '2-4 días hábiles',
        reliability: 'Rápido',
        description: 'Entrega más rápida con seguimiento completo'
      }
    ];
  }

  private getOCAFallback(request: ShippingRequest): ShippingRate[] {
    const baseRate = this.calculateBaseRate(request);
    
    return [
      {
        id: 'oca-standard',
        carrier: 'OCA',
        service: 'Estándar',
        price: Math.round(baseRate),
        delivery: '2-4 días hábiles',
        reliability: 'Confiable',
        description: 'Servicio confiable con amplia cobertura'
      },
      {
        id: 'oca-express',
        carrier: 'OCA',
        service: 'Express',
        price: Math.round(baseRate * 1.35),
        delivery: '24-48 horas',
        reliability: 'Express',
        description: 'Entrega ultra rápida para pedidos urgentes'
      }
    ];
  }

  private getAndreaniFallback(request: ShippingRequest): ShippingRate[] {
    const baseRate = this.calculateBaseRate(request);
    
    return [
      {
        id: 'andreani-standard',
        carrier: 'Andreani',
        service: 'Estándar',
        price: Math.round(baseRate * 1.15),
        delivery: '1-3 días hábiles',
        reliability: 'Premium',
        description: 'Servicio premium con excelente tracking'
      }
    ];
  }

  // ============================================================================
  // MÉTODOS AUXILIARES
  // ============================================================================

  private calculateBaseRate(request: ShippingRequest): number {
    const distance = Math.abs(parseInt(request.origin) - parseInt(request.destination));
    const baseRate = 1200 + (distance * 2);
    const weightSurcharge = Math.max(0, request.weight - 1) * 300;
    
    return baseRate + weightSurcharge;
  }

  private calculateVolume(dimensions?: { length: number; width: number; height: number }): number {
    if (!dimensions) return 0.001; // 1 litro por defecto
    
    return (dimensions.length * dimensions.width * dimensions.height) / 1000000; // Convertir a m³
  }

  private getReliabilityFromCarrier(carrier: string): string {
    const reliabilityMap: { [key: string]: string } = {
      'Correo Argentino': 'Económico',
      'OCA': 'Confiable',
      'Andreani': 'Premium'
    };
    
    return reliabilityMap[carrier] || 'Estándar';
  }

  /**
   * Verificar disponibilidad de servicio por zona
   */
  isServiceAvailableForZone(serviceId: string, zipCode: string): boolean {
    const zip = parseInt(zipCode);
    
    // AMBA - todas las opciones disponibles
    if (zip >= 1000 && zip <= 1999) {
      return true;
    }
    
    // Interior cercano - excluir express muy rápido
    if (zip >= 2000 && zip <= 3999) {
      return serviceId !== 'oca-express';
    }
    
    // Interior lejano - solo opciones estándar
    if (zip >= 4000 && zip <= 5999) {
      return !serviceId.includes('express');
    }
    
    // Patagonia - solo Correo Argentino y OCA estándar
    return serviceId.includes('correo-') || serviceId === 'oca-standard';
  }
}