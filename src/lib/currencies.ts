
export interface Currency {
    code: string;
    name: string;
    symbol: string;
    country: string;
}

export const currencies: Currency[] = [
  { code: 'AED', name: 'United Arab Emirates Dirham', symbol: 'د.إ', country: 'United Arab Emirates' },
  { code: 'USD', name: 'United States Dollar', symbol: '$', country: 'United States' },
  { code: 'EUR', name: 'Euro', symbol: '€', country: 'European Union' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', country: 'Japan' },
  { code: 'GBP', name: 'British Pound Sterling', symbol: '£', country: 'United Kingdom' },
  { code: 'AUD', name: 'Australian Dollar', symbol: '$', country: 'Australia' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: '$', country: 'Canada' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', country: 'Switzerland' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', country: 'China' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', country: 'India' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', country: 'Brazil' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', country: 'Russia' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', country: 'South Africa' },
];

export const getCurrency = (code?: string | null): Currency | undefined => {
    if (!code) return currencies.find(c => c.code === 'AED');
    return currencies.find(c => c.code.toLowerCase() === code.toLowerCase());
}
