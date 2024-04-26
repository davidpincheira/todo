import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenService } from '@shared/services/token.service';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {


  const tokenService = inject(TokenService)
  
  const token = tokenService.getToken()

  if(token){
    const authReq = req.clone({
      setHeaders: {
        access_token: `${token}`
      }
    });
    return next(authReq);
  }

  return next(req);

};
