import { Routes } from '@angular/router';
import { Carrito } from './pages/carrito/carrito';
import { Pedido } from './pages/pedido/pedido';

export const carritoRoutes: Routes = [
  {
    path: '',
    component: Carrito,
  },
  {
    path: 'pedido',
    component: Pedido,
  },
  {
    path: '**',
    redirectTo: '',
  },
];
