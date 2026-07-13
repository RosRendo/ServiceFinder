/**
 * Formats a given amount (assumed to be in USD) to either USD or KHR 
 * based on the current language/locale.
 * 
 * Note: Exchange rate is hardcoded for demonstration. 
 * In a real app, this might come from an API or settings.
 */

const EXCHANGE_RATE_USD_TO_KHR = 4000;

export function formatCurrency(amountInUsd: number, locale: string = 'en'): string {
  if (locale === 'km') {
    const amountInKhr = amountInUsd * EXCHANGE_RATE_USD_TO_KHR;
    // Format to Khmer standard without decimals if it's a whole number
    return `${amountInKhr.toLocaleString('km-KH')} ៛`;
  }
  
  // Default to USD
  return `$${amountInUsd.toFixed(2)}`;
}
