import { Routes } from '@angular/router';
import { RecoverPassword } from './pages/recover-password/recover-password';
import { ResetPassword } from './pages/reset-password/reset-password';
import { Signin } from './pages/signin/signin';
import { Signup } from './pages/signup/signup';

export const usuariosRoutes: Routes = [
  {
    path: 'signin',
    component: Signin,
  },
  {
    path: 'signup',
    component: Signup,
  },
  {
    path: 'recuperar',
    component: RecoverPassword,
  },
  {
    path: 'restablecer',
    component: ResetPassword,
  },
  {
    path: '',
    redirectTo: 'signin',
    pathMatch: 'full',
  },
];
