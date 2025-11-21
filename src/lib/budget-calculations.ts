import type { Resource, Activity, GeneralDiscount } from '@/types/budget';

export const calculateResourceCost = (
  resources: Resource[],
  resourceId: string,
  hours: number,
  fixedPrice: number
): number => {
  const resource = resources.find(r => r.id === resourceId);
  if (!resource) return 0;
  
  if (resource.costType === 'hourly' || resource.costType === 'quantity') {
    return hours * resource.pricePerHour;
  } else {
    return fixedPrice;
  }
};

// Calcola il subtotale dell'attività (senza IVA e senza sconto)
export const calculateActivityTotal = (
  resources: Resource[],
  activity: Activity
): number => {
  return activity.resources.reduce((total, assignment) => {
    return total + calculateResourceCost(resources, assignment.resourceId, assignment.hours, assignment.fixedPrice);
  }, 0);
};

// Calcola l'importo dello sconto dell'attività
export const calculateActivityDiscountAmount = (
  resources: Resource[],
  activity: Activity
): number => {
  if (!activity.discount || !activity.discount.enabled || activity.discount.value === 0) {
    return 0;
  }

  const subtotal = calculateActivityTotal(resources, activity);
  const baseAmount = activity.discount.applyOn === 'taxable' 
    ? subtotal 
    : subtotal + (subtotal * activity.vat / 100);

  if (activity.discount.type === 'percentage') {
    return baseAmount * activity.discount.value / 100;
  } else {
    return activity.discount.value;
  }
};

// Calcola il totale dell'attività con IVA e con sconto applicato
export const calculateActivityTotalWithVat = (
  resources: Resource[],
  activity: Activity
): number => {
  const subtotal = calculateActivityTotal(resources, activity);
  const discountAmount = calculateActivityDiscountAmount(resources, activity);
  
  if (!activity.discount || !activity.discount.enabled) {
    // Nessuno sconto: subtotale + IVA
    return subtotal + (subtotal * activity.vat / 100);
  }

  if (activity.discount.applyOn === 'taxable') {
    // Sconto applicato sull'imponibile
    const subtotalAfterDiscount = subtotal - discountAmount;
    return subtotalAfterDiscount + (subtotalAfterDiscount * activity.vat / 100);
  } else {
    // Sconto applicato sul totale IVAto
    const totalWithVat = subtotal + (subtotal * activity.vat / 100);
    return totalWithVat - discountAmount;
  }
};

// Calcola il subtotale generale (somma di tutti i subtotali delle attività con sconti applicati)
export const calculateGrandSubtotal = (
  resources: Resource[],
  activities: Activity[]
): number => {
  return activities.reduce((total, activity) => {
    const subtotal = calculateActivityTotal(resources, activity);
    const discountAmount = calculateActivityDiscountAmount(resources, activity);
    
    if (!activity.discount || !activity.discount.enabled) {
      return total + subtotal;
    }

    if (activity.discount.applyOn === 'taxable') {
      return total + (subtotal - discountAmount);
    } else {
      // Se lo sconto è sul totale IVAto, dobbiamo ricalcolare l'imponibile
      const totalWithVat = subtotal + (subtotal * activity.vat / 100);
      const totalAfterDiscount = totalWithVat - discountAmount;
      const subtotalAfterDiscount = totalAfterDiscount / (1 + activity.vat / 100);
      return total + subtotalAfterDiscount;
    }
  }, 0);
};

// Calcola il totale IVA generale
export const calculateGrandVat = (
  resources: Resource[],
  activities: Activity[]
): number => {
  return activities.reduce((total, activity) => {
    const subtotal = calculateActivityTotal(resources, activity);
    const discountAmount = calculateActivityDiscountAmount(resources, activity);
    
    if (!activity.discount || !activity.discount.enabled) {
      return total + (subtotal * activity.vat / 100);
    }

    if (activity.discount.applyOn === 'taxable') {
      const subtotalAfterDiscount = subtotal - discountAmount;
      return total + (subtotalAfterDiscount * activity.vat / 100);
    } else {
      const totalWithVat = subtotal + (subtotal * activity.vat / 100);
      const totalAfterDiscount = totalWithVat - discountAmount;
      const subtotalAfterDiscount = totalAfterDiscount / (1 + activity.vat / 100);
      return total + (subtotalAfterDiscount * activity.vat / 100);
    }
  }, 0);
};

// Calcola il totale senza sconto generale
export const calculateGrandTotalBeforeGeneralDiscount = (
  resources: Resource[],
  activities: Activity[]
): number => {
  return calculateGrandSubtotal(resources, activities) + calculateGrandVat(resources, activities);
};

// Calcola l'importo dello sconto generale
export const calculateGeneralDiscountAmount = (
  resources: Resource[],
  activities: Activity[],
  generalDiscount: GeneralDiscount
): number => {
  if (!generalDiscount.enabled || generalDiscount.value === 0) {
    return 0;
  }

  const subtotal = calculateGrandSubtotal(resources, activities);
  const totalWithVat = calculateGrandTotalBeforeGeneralDiscount(resources, activities);
  const baseAmount = generalDiscount.applyOn === 'taxable' ? subtotal : totalWithVat;

  if (generalDiscount.type === 'percentage') {
    return baseAmount * generalDiscount.value / 100;
  } else {
    return generalDiscount.value;
  }
};

// Calcola il gran totale finale (con sconto generale se applicabile)
export const calculateGrandTotal = (
  resources: Resource[],
  activities: Activity[],
  generalDiscount: GeneralDiscount
): number => {
  const totalBeforeDiscount = calculateGrandTotalBeforeGeneralDiscount(resources, activities);
  const generalDiscountAmount = calculateGeneralDiscountAmount(resources, activities, generalDiscount);
  return totalBeforeDiscount - generalDiscountAmount;
};

// Calcola il totale degli sconti applicati sulle attività
export const calculateTotalActivityDiscounts = (
  resources: Resource[],
  activities: Activity[]
): number => {
  return activities.reduce((total, activity) => {
    return total + calculateActivityDiscountAmount(resources, activity);
  }, 0);
};

