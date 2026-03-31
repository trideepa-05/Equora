export function generateUpiLink(upiId: string, name: string, amount: number) {
  return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    name
  )}&am=${amount.toFixed(2)}&cu=INR`;
}

export function generateUpiQrUrl(upiId: string, name: string, amount: number) {
  const link = generateUpiLink(upiId, name, amount);
  return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    link
  )}`;
}

