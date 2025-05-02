import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { User } from '@shared/models/user.model';
import { UsersService } from '@shared/services/users.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, HttpClientModule, CommonModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {

  user: User | null = null;
  form = this.formBuilder.group({
    email: ['', [Validators.email, Validators.required]],
    password: ['', [ Validators.required, Validators.minLength(6)]],
  });

  constructor(private userService: UsersService, private router: Router, private formBuilder: FormBuilder) { }

  register(){
    const { email, password } = this.form.getRawValue();
    console.log(email, password);
    //create an user
    this.userService.createUser(email!, password!)
    .subscribe(() => {
      //debugger
      this.router.navigate(['/profile']);
    })
  }

}
