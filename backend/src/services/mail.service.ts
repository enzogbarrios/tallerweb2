import nodemailer, { type Transporter } from 'nodemailer';
import { config } from '../config/env.js';

export type Mail = {
  para: string;
  asunto: string;
  texto: string;
  html: string;
};

export class MailService {
  private readonly transporter: Transporter | undefined;

  constructor() {
    const { host, port, user, pass } = config.smtp;

    this.transporter = host
      ? nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: user ? { user, pass } : undefined,
        })
      : undefined;
  }

  async enviar(mail: Mail) {
    if (!this.transporter) {
      console.log(`\n[mail sin SMTP] Para: ${mail.para}\nAsunto: ${mail.asunto}\n${mail.texto}\n`);
      return;
    }

    await this.transporter.sendMail({
      from: config.mailFrom,
      to: mail.para,
      subject: mail.asunto,
      text: mail.texto,
      html: mail.html,
    });
  }

  async enviarRecuperarPassword(para: string, nombre: string, link: string, minutos: number) {
    await this.enviar({
      para,
      asunto: 'Recuperá tu contraseña de Shaka',
      texto:
        `Hola ${nombre}:\n\n` +
        `Pediste restablecer tu contraseña. Entrá a este link para elegir una nueva:\n${link}\n\n` +
        `El link vence en ${minutos} minutos y se puede usar una sola vez.\n` +
        'Si no fuiste vos, ignorá este mail: tu contraseña no cambia.',
      html:
        `<p>Hola ${escaparHtml(nombre)}:</p>` +
        '<p>Pediste restablecer tu contraseña. Hacé click en el botón para elegir una nueva:</p>' +
        `<p><a href="${link}" style="display:inline-block;padding:12px 24px;background:#000;` +
        'color:#fff;text-decoration:none;text-transform:uppercase">Restablecer contraseña</a></p>' +
        `<p>O copiá este link en el navegador: <br>${link}</p>` +
        `<p>El link vence en ${minutos} minutos y se puede usar una sola vez.</p>` +
        '<p>Si no fuiste vos, ignorá este mail: tu contraseña no cambia.</p>',
    });
  }
}

function escaparHtml(texto: string) {
  return texto
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
