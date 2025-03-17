import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TokenService {

  constructor() { }

  saveToken(token: string){
    localStorage.setItem("token", token);
  }

  getToken(){
    return localStorage.getItem("token");
  }

  removeToken(){
    return localStorage.removeItem("token");
  }    

  isValidToken(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    try {
      // Decodificar el token JWT para obtener el payload
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      // Verificar si tiene fecha de expiración y si está vencido
      const isExpired = payload.exp ? payload.exp * 1000 < Date.now() : false;
      
      return !isExpired;
    } catch (e) {
      // Si hay error al decodificar el token, lo consideramos inválido
      return false;
    }
  }

}
