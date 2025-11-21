export interface Resource {
  id: string;
  name: string;
  costType: 'hourly' | 'quantity' | 'fixed';
  pricePerHour: number;
}

export interface ResourceAssignment {
  resourceId: string;
  hours: number; // per orario o quantità
  fixedPrice: number; // per fisso - inserito nell'attività
}

export interface ActivityDiscount {
  enabled: boolean;
  type: 'percentage' | 'fixed';
  value: number;
  applyOn: 'taxable' | 'withVat'; // imponibile o totale ivato
}

export interface Activity {
  id: string;
  name: string;
  description: string;
  resources: ResourceAssignment[];
  vat: number; // Percentuale IVA specifica per questa attività
  discount?: ActivityDiscount; // Sconto opzionale per l'attività
  startDate?: string; // Data inizio attività (ISO format)
  endDate?: string; // Data fine attività (ISO format)
}

export interface GeneralDiscount {
  enabled: boolean;
  type: 'percentage' | 'fixed';
  value: number;
  applyOn: 'taxable' | 'withVat'; // imponibile o totale ivato
}

