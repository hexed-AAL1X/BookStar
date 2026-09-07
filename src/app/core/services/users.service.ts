import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from '../../models/user.model';
import { Observable } from 'rxjs';
import { environment } from '../../env/enviroment';

@Injectable({ providedIn: 'root' })
export class UserService {
  private api = environment.apiUrl + '/users';

  constructor(private http: HttpClient) {}

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.api}/profile`);
  }

  updateProfile(data: Partial<User> & { password?: string; currentPassword?: string; newPassword?: string; oldPassword?: string }): Observable<User> {
    return this.http.put<User>(`${this.api}/profile`, data);
  }



  deleteProfile(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.api}/profile`);
  }

  // Obtener usuario por ID
  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.api}/${id}`);
  }

  // Admin
  getAll(): Observable<User[]> {
    return this.http.get<User[]>(this.api);
  }

  getAllUsers(): Observable<any> {
    return this.http.get<any>(this.api);
  }

  updateUser(id: string, data: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.api}/${id}`, data);
  }

  updateUserRole(id: string, role: string): Observable<any> {
    return this.http.put<any>(`${this.api}/${id}/role`, { role });
  }

  deleteUser(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.api}/${id}`);
  }
}