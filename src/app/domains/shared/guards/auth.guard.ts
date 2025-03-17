import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenService } from '@shared/services/token.service';

export const authGuard: CanActivateFn = (route, state) => {
  
  const router = inject(Router)
  const tokenService = inject(TokenService)

  const token = tokenService.getToken();

  let esvalid = tokenService.isValidToken();

  if(!token || !esvalid){
    router.navigateByUrl('/login');
    return false
  }
  return true 
};
