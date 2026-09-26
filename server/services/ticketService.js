import QRCode from 'qrcode';
export async function generateTicketQR(bookingId) {
  return QRCode.toDataURL(bookingId, { width: 240, margin: 1 });
}