import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Auth } from '@shared/models/auth.model';
import { tap } from 'rxjs';
import { TokenService } from './token.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private url = new URL(`http://localhost:3000/api/login`)

  private http = inject(HttpClient)
  private tokenService = inject(TokenService)

  constructor() { }

  login(email: string, password: string){

    return this.http.post<Auth>(this.url.toString(),{ email, password })
    .pipe(
      tap(response => this.tokenService.saveToken(response.access_token)
      ))
  }
  
}
