import { Router } from '@angular/router';
import { AuthService } from '../../api/services/auth/auth.service';
import { CarritoService } from '../../api/services/carrito/carrito.service';
import { NotificacionesService } from '../../api/services/notificaciones/notificaciones.service';
import { leerError } from '../../api/utils/leer-error';
import { nombreVariante, Producto, Variante } from '../models/producto.model';

// agrega un producto solo si hay sesion
export function agregarAlCarrito(
  auth: AuthService,
  router: Router,
  carrito: CarritoService,
  notificaciones: NotificacionesService,
  producto: Producto,
  variante: Variante,
  cantidad = 1,
): void {
  if (!auth.usuarioActual()) {
    notificaciones.mostrar('Iniciá sesión para agregar productos al carrito.', 'info');
    router.navigate(['/auth/signin'], { queryParams: { returnUrl: router.url } });
    return;
  }

  if (carrito.cantidadDe(variante.id) + cantidad > variante.stock) {
    const disponibles = variante.stock - carrito.cantidadDe(variante.id);
    notificaciones.mostrar(
      disponibles > 0
        ? `Solo podés agregar ${disponibles} ${disponibles === 1 ? 'unidad' : 'unidades'} más.`
        : 'Ya tenés en el carrito todo el stock disponible.',
      'error',
    );
    return;
  }

  carrito.agregar(variante, cantidad).subscribe({
    next: () => {
      const unidades = cantidad === 1 ? 'unidad' : 'unidades';
      const verbo = cantidad === 1 ? 'se agregó' : 'se agregaron';
      const detalle = nombreVariante(variante);
      notificaciones.mostrar(
        `${cantidad} ${unidades} de ${producto.nombre}${detalle ? ` (${detalle})` : ''} ${verbo} al carrito.`,
      );
    },
    error: (error) => notificaciones.mostrar(leerError(error).mensaje, 'error'),
  });
}
