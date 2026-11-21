import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { REQUISITOS_PASSWORD } from '../../validators/password.validator';

@Component({
  selector: 'app-medidor-password',
  templateUrl: './medidor-password.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class MedidorPassword {
  readonly valor = input.required<string>();

  readonly requisitos = computed(() =>
    REQUISITOS_PASSWORD.map((requisito) => ({
      texto: requisito.texto,
      cumple: requisito.test(this.valor()),
    })),
  );

  readonly fortaleza = computed(
    () => this.requisitos().filter((requisito) => requisito.cumple).length,
  );

  readonly etiqueta = computed(() => {
    const fortaleza = this.fortaleza();

    if (fortaleza <= 1) return 'Muy débil';
    if (fortaleza === 2) return 'Débil';
    if (fortaleza === 3) return 'Regular';
    if (fortaleza === 4) return 'Buena';
    return 'Fuerte';
  });
}
