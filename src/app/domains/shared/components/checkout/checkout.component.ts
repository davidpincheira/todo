import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RequestStatus } from '@shared/models/request-status.model';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent {

  form = this.formBuilder.group({
    email: ['', [Validators.email, Validators.required]],
    address: ['', [ Validators.required, Validators.minLength(6)]],
    number: ['', [ Validators.required, Validators.minLength(6)]],
    apartment: ['', [ Validators.required, Validators.minLength(6)]],
    city: ['', [ Validators.required, Validators.minLength(6)]],    
    zip_code: ['', [ Validators.required, Validators.minLength(6)]],    
    province: ['', [ Validators.required, Validators.minLength(6)]],    
    country: ['', [ Validators.required, Validators.minLength(6)]],
    name: ['', [ Validators.required, Validators.minLength(6)]],
    lastname: ['', [ Validators.required, Validators.minLength(6)]],
    phone: ['', [ Validators.required, Validators.minLength(6)]],
    
  });
  status: RequestStatus = 'init';

  constructor(private router: Router, private formBuilder: FormBuilder,) { }


}
