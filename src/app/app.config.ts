import { ApplicationConfig } from '@angular/core';
import { PreloadAllModules, provideRouter, withComponentInputBinding, withPreloading } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { tokenInterceptor } from '@shared/interceptors/token.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, 
      withComponentInputBinding(), //esta propiedad hace que los parametros le lleguen como inputs a las paginas
      withPreloading(PreloadAllModules)), //esta propiedad hace el prefetching, (carga en diferido)
    provideHttpClient(withInterceptors([tokenInterceptor]))
  ]
};
