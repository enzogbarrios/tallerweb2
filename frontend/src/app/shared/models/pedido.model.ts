import { Clasificacion } from './producto.model';
import { Usuario } from './usuario.model';

export const ESTADOS_PEDIDO = [
  'Confirmado',
  'En preparación',
  'Enviado',
  'Entregado',
  'Cancelado',
] as const;

export type EstadoPedido = (typeof ESTADOS_PEDIDO)[number];

export type EstadoPago = 'pendiente' | 'aprobado' | 'rechazado';

export type Comprador = Pick<Usuario, 'id' | 'nombre' | 'apellido' | 'email'>;

export const PROVINCIAS = [
  'Buenos Aires',
  'Ciudad Autónoma de Buenos Aires',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego',
  'Tucumán',
] as const;

export type MarcaTarjeta = 'visa' | 'mastercard' | 'amex' | 'otra';

export interface DatosComprador {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  dni: string;
}

export interface DireccionEnvio {
  calle: string;
  numero: string;
  piso_depto: string | null;
  ciudad: string;
  provincia: string;
  codigo_postal: string;
  indicaciones: string | null;
}

export interface TarjetaPedido {
  marca: MarcaTarjeta | null;
  ultimos4: string | null;
}

export interface ProductoPedido {
  id: number | null;
  nombre: string;
  clasificacion: Clasificacion;
  imagen: string;
  precio: number;
}

export interface ItemPedido {
  producto: ProductoPedido;
  talle: string;
  color: string;
  cantidad: number;
}

export interface Pedido {
  id: number;
  fecha: string;
  direccion_envio: string;
  items: ItemPedido[];
  subtotal: number;
  envio: number;
  total: number;
  estado: EstadoPedido;
  estado_pago: EstadoPago;
  comprador: Comprador | null;
  datos_comprador: DatosComprador | null;
  direccion: DireccionEnvio | null;
  tarjeta: TarjetaPedido;
}

export interface TarjetaPago {
  numero: string;
  titular: string;
  vencimiento: string;
  cvv: string;
}

export interface DatosPedido {
  comprador: DatosComprador;
  direccion: DireccionEnvio;
  tarjeta: TarjetaPago;
}

export type OrdenVentas = 'recientes' | 'antiguos' | 'total_desc' | 'total_asc';

