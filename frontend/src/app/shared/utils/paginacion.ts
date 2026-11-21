export function paginasVisibles(
  paginaActual: number,
  totalPaginas: number,
): Array<number | null> {
  const visibles: Array<number | null> = [];

  for (let numero = 1; numero <= totalPaginas; numero++) {
    if (numero === 1 || numero === totalPaginas || Math.abs(numero - paginaActual) <= 1) {
      visibles.push(numero);
    } else if (visibles[visibles.length - 1] !== null) {
      visibles.push(null);
    }
  }

  return visibles;
}

export function slicePagina<T>(items: T[], pagina: number, limite: number): T[] {
  const inicio = (pagina - 1) * limite;
  return items.slice(inicio, inicio + limite);
}
