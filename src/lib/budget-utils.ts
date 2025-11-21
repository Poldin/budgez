// Funzione per calcolare il giorno dell'anno
export const getDayOfYear = (): number => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
};

export const getDefaultBudgetName = (): string => {
  const now = new Date();
  return `Preventivo #${getDayOfYear()}/${now.getFullYear()}`;
};

// Formattazione numeri in stile italiano (1.000,50)
export const formatNumber = (num: number): string => {
  return num.toLocaleString('it-IT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// Converte una Date in formato YYYY-MM-DD preservando la data locale (senza shift UTC)
export const formatDateToLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

