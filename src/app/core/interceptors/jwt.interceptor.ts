import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Router } from '@angular/router';

export const JwtInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  
  const token = localStorage.getItem('token');
  let authReq = req;
  
  if (token) {
    console.log('Adding token to request:', req.url);
    authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  } else {
    console.log('No token found for request:', req.url);
  }
  
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      console.log('HTTP Error:', error.status, error.url);
      if (error.status === 401 || error.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
}; 