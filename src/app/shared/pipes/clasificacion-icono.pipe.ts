import { Pipe, PipeTransform } from '@angular/core';
import { Clasificacion } from '../models/producto.model';

@Pipe({
  name: 'clasificacionIcono',
})
export class ClasificacionIconoPipe implements PipeTransform {
  private readonly iconos: Record<Clasificacion, string> = {
    Tecnología: 'bi-cpu',
    Indumentaria: 'bi-bag',
    Accesorios: 'bi-watch',
    Hogar: 'bi-lamp',
  };

  transform(clasificacion: Clasificacion | string): string {
    return this.iconos[clasificacion as Clasificacion] ?? 'bi-tag';
  }
}
