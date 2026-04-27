
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 465,
  secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const RESTAURANT_NAME = 'Mesón Marinero';
const RESTAURANT_ADDRESS = 'Calle Mayor, 123, Puerto de Santa María'; // Ejemplo
const FROM_EMAIL = process.env.SMTP_FROM || `"Alex - ${RESTAURANT_NAME}" <${process.env.SMTP_USER}>`;
const OVERRIDE_RECIPIENT = process.env.EMAIL_OVERRIDE_RECIPIENT;

/**
 * Plantilla base para los correos
 */
const getBaseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap');
    body {
      font-family: 'Montserrat', sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f4f7f9;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #004e92 0%, #000428 100%);
      padding: 40px 20px;
      text-align: center;
      color: white;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    .content {
      padding: 30px;
    }
    .booking-details {
      background: #fdfdfd;
      border: 1px solid #eee;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .detail-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      border-bottom: 1px dashed #eee;
      padding-bottom: 8px;
    }
    .detail-item:last-child {
      border-bottom: none;
    }
    .label {
      font-weight: bold;
      color: #004e92;
    }
    .footer {
      background: #f9f9f9;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #777;
    }
    .button {
        display: inline-block;
        padding: 12px 24px;
        background: #004e92;
        color: white !important;
        text-decoration: none;
        border-radius: 6px;
        margin-top: 20px;
        font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${RESTAURANT_NAME}</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${RESTAURANT_NAME}</p>
      <p>${RESTAURANT_ADDRESS}</p>
      <p>Este es un correo automático, por favor no responda.</p>
    </div>
  </div>
</body>
</html>
`;

/**
 * Enviar confirmación de reserva
 */
exports.sendBookingConfirmation = async (booking, customer) => {
  const dateStr = new Date(booking.date).toLocaleDateString('es-ES', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const timeStr = new Date(booking.date).toLocaleTimeString('es-ES', {
    hour: '2-digit', minute: '2-digit'
  });

  const content = `
    <h2>¡Hola, ${customer.firstName}!</h2>
    <p>Gracias por elegirnos. Tu reserva ha sido confirmada correctamente.</p>
    <div class="booking-details">
      <div class="detail-item">
        <span class="label">Fecha:</span>
        <span>${dateStr}</span>
      </div>
      <div class="detail-item">
        <span class="label">Hora:</span>
        <span>${timeStr}</span>
      </div>
      <div class="detail-item">
        <span class="label">Comensales:</span>
        <span>${booking.pax} personas</span>
      </div>
      <div class="detail-item">
        <span class="label">Zona/Mesa:</span>
        <span>${booking.table?.zone?.name || 'Salón Principal'}</span>
      </div>
    </div>
    <p>Te esperamos en <strong>${RESTAURANT_NAME}</strong>. Por motivos de gestión, si necesitas <strong>cancelar o modificar</strong> tu reserva, por favor hazlo <strong>llamando directamente al restaurante</strong>.</p>
    <div style="text-align: center; margin-top: 20px; color: #777;">
        <p>☎️ Teléfono: 956 00 00 00</p>
    </div>
  `;

  const mailOptions = {
    from: FROM_EMAIL,
    to: OVERRIDE_RECIPIENT || customer.email,
    subject: `Confirmación de Reserva - ${RESTAURANT_NAME}`,
    html: getBaseTemplate(content),
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Email de confirmación enviado a ${mailOptions.to}`);
  } catch (error) {
    console.error('❌ Error enviando email de confirmación:', error);
  }
};
