export function validateOrderInput(text: string): { productName: string; quantity: number } | null {
  const parts = text.trim().split(/\s+/);
  if (parts.length < 2) return null;
  
  const productName = parts.slice(0, -1).join(' ');
  const quantity = parseInt(parts[parts.length - 1]);
  
  if (isNaN(quantity) || quantity < 1) return null;
  
  return { productName, quantity };
}

export function validateWaId(waId: string): boolean {
  return /^\d{1,15}@s\.whatsapp\.net$/.test(waId) || /^\d{10,15}$/.test(waId);
}

export function sanitizeInput(input: string): string {
  return input.replace(/[<>"'&]/g, '').trim().substring(0, 255);
}
