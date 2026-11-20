import { Routes } from '@angular/router';
import { Carrito } from './pages/carrito/carrito';
import { Checkout } from './pages/checkout/checkout';
import { Pedido } from './pages/pedido/pedido';

export const carritoRoutes: Routes = [
  {
    path: '',
    component: Carrito,
  },
  {
    path: 'checkout',
    component: Checkout,
  },
  {
    path: 'pedido/:id',
    component: Pedido,
  },
  {
    path: '**',
    redirectTo: '',
  },
];
