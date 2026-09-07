import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User, UserRole } from '../../models/user.model';
import { Observable } from 'rxjs';
import { environment } from '../../env/enviroment';

export interface AuthError {
  message: string;
  status?: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = environment.apiUrl + '/auth';

  constructor(private http: HttpClient) {}

  register(data: { name: string; email: string; password: string; role?: UserRole }): Observable<any> {
    return this.http.post(`${this.api}/register`, data);
  }

  login(data: { email: string; password: string }): Observable<{ token: string; user: User }> {
    return this.http.post<{ token: string; user: User }>(`${this.api}/login`, data);
  }

  isAuthenticated(): boolean {
    return this.isTokenValid();
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isTokenValid(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    try {
      // Verificar si el token tiene el formato correcto (JWT)
      const parts = token.split('.');
      if (parts.length !== 3) return false;
      
      // Decodificar el payload del JWT
      const payload = JSON.parse(atob(parts[1]));
      const currentTime = Date.now() / 1000;
      
      // Verificar si el token ha expirado
      if (payload.exp && payload.exp < currentTime) {
        this.logout();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error validating token:', error);
      this.logout();
      return false;
    }
  }
}