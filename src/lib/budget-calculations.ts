import type { Resource, Activity, GeneralDiscount } from '@/types/budget';

export const calculateResourceCost = (
  resources: Resource[],
  resourceId: string,
  hours: number,
  fixedPrice: number
): number => {
  const resource = resources.find(r => r.id === resourceId);
  if (!resource) return 0;
  
  let baseCost: number;
  if (resource.costType === 'hourly' || resource.costType === 'quantity') {
    baseCost = hours * resource.pricePerHour;
  } else {
    baseCost = fixedPrice;
  }
  
  // Applica il margine della risorsa se presente
  const margin = resource.margin || 0;
  if (margin > 0) {
    return baseCost * (1 + margin / 100);
  }
  
  return baseCost;
};

// Calcola il subtotale dell'attività (senza IVA e senza sconto, ma con margine risorse)
export const calculateActivityTotal = (
  resources: Resource[],
  activity: Activity
): number => {
  const subtotalWithResourceMargins = activity.resources.reduce((total, assignment) => {
    return total + calculateResourceCost(resources, assignment.resourceId, assignment.hours, assignment.fixedPrice);
  }, 0);
  
  // Applica il margine dell'attività se presente
  const activityMargin = activity.margin || 0;
  if (activityMargin > 0) {
    return subtotalWithResourceMargins * (1 + activityMargin / 100);
  }
  
  return subtotalWithResourceMargins;
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

// Calcola l'importo del margine generale
export const calculateGeneralMarginAmount = (
  resources: Resource[],
  activities: Activity[],
  generalMargin?: { enabled: boolean; value: number }
): number => {
  if (!generalMargin?.enabled || generalMargin.value === 0) {
    return 0;
  }

  const totalBeforeDiscount = calculateGrandTotalBeforeGeneralDiscount(resources, activities);
  return totalBeforeDiscount * (generalMargin.value / 100);
};

// Calcola l'importo dello sconto generale (considerando il margine se presente)
export const calculateGeneralDiscountAmount = (
  resources: Resource[],
  activities: Activity[],
  generalDiscount: GeneralDiscount,
  generalMargin?: { enabled: boolean; value: number }
): number => {
  if (!generalDiscount.enabled || generalDiscount.value === 0) {
    return 0;
  }

  const subtotal = calculateGrandSubtotal(resources, activities);
  const totalBeforeDiscount = calculateGrandTotalBeforeGeneralDiscount(resources, activities);
  
  // Calcola il totale dopo il margine (se presente)
  let totalAfterMargin = totalBeforeDiscount;
  if (generalMargin?.enabled && generalMargin.value > 0) {
    totalAfterMargin = totalBeforeDiscount * (1 + generalMargin.value / 100);
  }
  
  const baseAmount = generalDiscount.applyOn === 'taxable' ? subtotal : totalAfterMargin;

  if (generalDiscount.type === 'percentage') {
    return baseAmount * generalDiscount.value / 100;
  } else {
    return generalDiscount.value;
  }
};

// Calcola il gran totale finale (prima margine, poi sconto generale)
export const calculateGrandTotal = (
  resources: Resource[],
  activities: Activity[],
  generalDiscount: GeneralDiscount,
  generalMargin?: { enabled: boolean; value: number }
): number => {
  const totalBeforeDiscount = calculateGrandTotalBeforeGeneralDiscount(resources, activities);
  
  // Applica prima il margine generale se presente e abilitato
  let totalAfterMargin = totalBeforeDiscount;
  if (generalMargin?.enabled && generalMargin.value > 0) {
    totalAfterMargin = totalBeforeDiscount * (1 + generalMargin.value / 100);
  }
  
  // Poi applica lo sconto generale sul totale con margine
  let discountAmount = 0;
  if (generalDiscount.enabled && generalDiscount.value > 0) {
    const subtotal = calculateGrandSubtotal(resources, activities);
    const baseAmount = generalDiscount.applyOn === 'taxable' 
      ? subtotal  // Se applicato sull'imponibile, usa il subtotale
      : totalAfterMargin; // Se applicato sul totale IVAto, usa il totale con margine
    
    if (generalDiscount.type === 'percentage') {
      discountAmount = baseAmount * generalDiscount.value / 100;
    } else {
      discountAmount = generalDiscount.value;
    }
  }
  
  return totalAfterMargin - discountAmount;
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

// Calcola il costo base di una risorsa senza margine
const calculateResourceBaseCost = (
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

// Calcola il subtotale dell'attività senza margini (né risorse né attività)
const calculateActivityTotalWithoutMargins = (
  resources: Resource[],
  activity: Activity
): number => {
  return activity.resources.reduce((total, assignment) => {
    return total + calculateResourceBaseCost(resources, assignment.resourceId, assignment.hours, assignment.fixedPrice);
  }, 0);
};

// Calcola il totale assoluto di tutti i margini applicati (risorse + attività + generale)
export const calculateTotalMarginAmount = (
  resources: Resource[],
  activities: Activity[],
  generalMargin?: { enabled: boolean; value: number }
): number => {
  let totalMargin = 0;
  
  // Margine delle risorse
  activities.forEach(activity => {
    activity.resources.forEach(assignment => {
      const baseCost = calculateResourceBaseCost(resources, assignment.resourceId, assignment.hours, assignment.fixedPrice);
      const costWithMargin = calculateResourceCost(resources, assignment.resourceId, assignment.hours, assignment.fixedPrice);
      totalMargin += (costWithMargin - baseCost);
    });
  });
  
  // Margine delle attività
  activities.forEach(activity => {
    const subtotalWithResourceMargins = activity.resources.reduce((total, assignment) => {
      return total + calculateResourceCost(resources, assignment.resourceId, assignment.hours, assignment.fixedPrice);
    }, 0);
    const activityMargin = activity.margin || 0;
    if (activityMargin > 0) {
      const marginAmount = subtotalWithResourceMargins * (activityMargin / 100);
      totalMargin += marginAmount;
    }
  });
  
  // Margine generale
  totalMargin += calculateGeneralMarginAmount(resources, activities, generalMargin);
  
  return totalMargin;
};

// Calcola la percentuale finale complessiva di margine
export const calculateTotalMarginPercentage = (
  resources: Resource[],
  activities: Activity[],
  generalMargin?: { enabled: boolean; value: number }
): number => {
  const totalBase = calculateGrandTotalBeforeGeneralDiscount(resources, activities);
  if (totalBase === 0) return 0;
  
  const totalMarginAmount = calculateTotalMarginAmount(resources, activities, generalMargin);
  return (totalMarginAmount / totalBase) * 100;
};

