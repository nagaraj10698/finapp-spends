

export interface Currency {
    code: string;
    name: string;
    symbol: string;
    country: string;
}

export const currencies: Currency[] = [
  { code: 'AED', name: 'United Arab Emirates Dirham', symbol: 'د.إ', country: 'AE' },
  { code: 'USD', name: 'United States Dollar', symbol: '$', country: 'US' },
  { code: 'EUR', name: 'Euro', symbol: '€', country: 'EU' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', country: 'JP' },
  { code: 'GBP', name: 'British Pound Sterling', symbol: '£', country: 'GB' },
  { code: 'AUD', name: 'Australian Dollar', symbol: '$', country: 'AU' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: '$', country: 'CA' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', country: 'CH' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', country: 'CN' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', country: 'IN' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', country: 'BR' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', country: 'RU' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', country: 'ZA' },
];

export const getCurrency = (code?: string | null): Currency | undefined => {
    if (!code) return currencies.find(c => c.code === 'AED');
    return currencies.find(c => c.code.toLowerCase() === code.toLowerCase());
}

export const getCurrencyByCountry = (countryCode?: string | null): Currency | undefined => {
    if (!countryCode) return undefined;
    return currencies.find(c => c.country.toLowerCase() === countryCode.toLowerCase());
}