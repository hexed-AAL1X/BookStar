import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { Home } from './features/home/home';
import { Books } from './features/books/books';
import { Orders } from './features/orders/orders';
import { Posts } from './features/posts/posts';
import { ProfileComponent } from './features/users/profile.component';
import { UsersComponent } from './features/users/users.component';
import { AuthGuard } from './core/guard/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: Home, canActivate: [AuthGuard] },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'books', component: Books },
  { path: 'orders', component: Orders },
  { path: 'posts', component: Posts },
  { path: 'users/profile', component: ProfileComponent },
  { path: 'users', component: UsersComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '/home' }
];
