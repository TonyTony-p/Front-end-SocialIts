import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);
  
  // ✅ ESCLUDI le rotte pubbliche (login, register, ecc.)
  const publicRoutes = ['/api/auth/', '/login', '/register'];
  const isPublicRoute = publicRoutes.some(route => req.url.includes(route));
  
  // Solo in ambiente browser, usa console.log e localStorage
  if (isBrowser) {
    console.log('🔐 Auth Interceptor attivato');
    console.log('🌐 URL richiesta:', req.url);
    console.log('🔓 È una rotta pubblica?', isPublicRoute ? 'SI (skip token)' : 'NO');
  }
  
  // Se è una rotta pubblica, passa la richiesta senza modificarla
  if (isPublicRoute) {
    if (isBrowser) {
      console.log('⏭️ Rotta pubblica, skip interceptor');
    }
    return next(req);
  }
  
  // Controlla localStorage SOLO se siamo nel browser
  let token: string | null = null;
  if (isBrowser) {
    token = localStorage.getItem('token');
    console.log('🔑 Token presente:', token ? 'SI ✅' : 'NO ❌');
  }
  
  // Se c'è un token, clona la richiesta e aggiungi l'header Authorization
  if (token) {
    const clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (isBrowser) {
      console.log('✅ Token aggiunto all\'header Authorization');
      console.log('📤 Headers:', clonedRequest.headers.keys());
    }
    
    return next(clonedRequest);
  }
  
  if (isBrowser) {
    console.log('⚠️ Nessun token trovato, richiesta inviata senza Authorization');
  }
  return next(req);
};