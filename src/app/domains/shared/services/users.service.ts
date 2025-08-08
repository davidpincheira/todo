import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { User } from '@shared/models/user.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  private apiUrl = "http://localhost:3000/api";

  userId = signal(0)
  user!: User

  private http = inject(HttpClient)

  constructor() { }

  getUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/profile`);
  }

  createUser(name: string, password: string): Observable<User> {
    const user = { name, password };
    return this.http.post<User>(`${this.apiUrl}/signup`, user);
  }

  // Enviar código de verificación
  sendVerificationCode(data: { method: 'email' | 'sms', contact: string }) {
    return this.http.post(`${this.apiUrl}/auth/send-verification-code`, data);
  }

  // Verificar código
  verifyCode(data: { method: 'email' | 'sms', contact: string, code: string }) {
    return this.http.post(`${this.apiUrl}/auth/verify-code`, data);
  }

  
}
