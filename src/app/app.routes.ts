import { Routes } from '@angular/router';
import { HomeComponent } from './public/home/home.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
  },
  {
    path: 'productos',
    loadChildren: () =>
      import('./modules/productos/productos.routes').then((modulo) => modulo.productosRoutes),
  },
  {
    path: 'carrito',
    loadChildren: () =>
      import('./modules/carrito/carrito.routes').then((modulo) => modulo.carritoRoutes),
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('./modules/usuarios/usuarios.routes').then((modulo) => modulo.usuariosRoutes),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
