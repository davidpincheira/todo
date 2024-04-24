import { HttpClientModule } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { User } from '@shared/models/user.model';
import { AuthService } from '@shared/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, HttpClientModule, CommonModule, RouterOutlet, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  user: User | null = null;
  form = this.formBuilder.group({
    email: ['', [Validators.email, Validators.required]],
    password: ['', [ Validators.required, Validators.minLength(6)]],
  });

  constructor(private auth: AuthService, private router: Router, private formBuilder: FormBuilder) { }
  

  login(){
    const { email, password } = this.form.getRawValue();
    console.log(email, password)
    this.auth.login(email!, password!)
    .subscribe(() => {
      this.router.navigate(['/']);
    })
  }

  doLogin(){
    /* if (this.form.valid) {
      this.status = 'loading';
      const { email, password } = this.form.getRawValue();
      this.auth.loginAndGet(email, password).subscribe({
        next: (rta) => {
          this.status = 'success';
          this.router.navigate(['/profile']);
          console.log(rta);
        },
        error: (error) => {
          this.status = 'failed';
          console.log(error)
        }
      })
    } else {
      this.form.markAllAsTouched();
    } */
  }

  redirectToRegister(){
    this.router.navigate(['/register']);
  }
  
}
