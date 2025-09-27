/**
 * Types pour la gestion des Heures Non Ouvrées (HNO)
 */

export enum HNOTimeSlot {
  WEEKDAY_EVENING = 'weekday_evening', // Semaine jours ouvrés en soirée (18h-22h) : 25%
  WEEKDAY_NIGHT = 'weekday_night',     // Semaine jours ouvrés nuit (22h-09h) : 35%
  SATURDAY_DAY = 'saturday_day',       // Samedi journée (09h-18h) : 25%
  SATURDAY_EVENING = 'saturday_evening', // Samedi soirée (18h-22h) : 50%
  SATURDAY_NIGHT = 'saturday_night',   // Samedi nuit (22h-09h) : 65%
  SUNDAY_HOLIDAY = 'sunday_holiday',   // Dimanche + jour férié (toute la journée) : 100%
}

export interface HNORate {
  timeSlot: HNOTimeSlot;
  label: string;
  description: string;
  majorationPercent: number;
  timeRange: string;
}

export const HNO_RATES: Record<HNOTimeSlot, HNORate> = {
  [HNOTimeSlot.WEEKDAY_EVENING]: {
    timeSlot: HNOTimeSlot.WEEKDAY_EVENING,
    label: 'Soirée semaine',
    description: 'Semaine jours ouvrés en soirée',
    majorationPercent: 25,
    timeRange: '18h-22h',
  },
  [HNOTimeSlot.WEEKDAY_NIGHT]: {
    timeSlot: HNOTimeSlot.WEEKDAY_NIGHT,
    label: 'Nuit semaine',
    description: 'Semaine jours ouvrés nuit',
    majorationPercent: 35,
    timeRange: '22h-09h',
  },
  [HNOTimeSlot.SATURDAY_DAY]: {
    timeSlot: HNOTimeSlot.SATURDAY_DAY,
    label: 'Samedi journée',
    description: 'Samedi journée',
    majorationPercent: 25,
    timeRange: '09h-18h',
  },
  [HNOTimeSlot.SATURDAY_EVENING]: {
    timeSlot: HNOTimeSlot.SATURDAY_EVENING,
    label: 'Samedi soirée',
    description: 'Samedi soirée',
    majorationPercent: 50,
    timeRange: '18h-22h',
  },
  [HNOTimeSlot.SATURDAY_NIGHT]: {
    timeSlot: HNOTimeSlot.SATURDAY_NIGHT,
    label: 'Samedi nuit',
    description: 'Samedi nuit',
    majorationPercent: 65,
    timeRange: '22h-09h',
  },
  [HNOTimeSlot.SUNDAY_HOLIDAY]: {
    timeSlot: HNOTimeSlot.SUNDAY_HOLIDAY,
    label: 'Dimanche/Férié',
    description: 'Dimanche + jour férié',
    majorationPercent: 100,
    timeRange: 'Toute la journée',
  },
};

export interface HNOEntry {
  id?: string;
  date: string; // Format YYYY-MM-DD
  timeSlot: HNOTimeSlot;
  hours: number; // Nombre d'heures (entier, arrondi)
  description?: string;
}

export interface TimesheetHNO {
  timesheetId: string;
  entries: HNOEntry[];
  totalHours: number;
  totalMajoratedAmount: number; // Montant total majoré
}

/**
 * Calcule le taux horaire à partir du TJM
 * Formule : Taux Horaire = Taux Journalier / 7
 */
export const calculateHourlyRate = (tjm: number): number => {
  return tjm / 7;
};

/**
 * Calcule le montant majoré pour une entrée HNO
 */
export const calculateHNOAmount = (entry: HNOEntry, tjm: number, customRates?: Record<HNOTimeSlot, HNORate>): number => {
  const hourlyRate = calculateHourlyRate(tjm);
  const rates = customRates || HNO_RATES;
  const rate = rates[entry.timeSlot];
  const majoratedRate = hourlyRate * (1 + rate.majorationPercent / 100);
  return Math.round(entry.hours * majoratedRate);
};

/**
 * Calcule le total des montants HNO pour un timesheet
 */
export const calculateTotalHNOAmount = (entries: HNOEntry[], tjm: number, customRates?: Record<HNOTimeSlot, HNORate>): number => {
  return entries.reduce((total, entry) => total + calculateHNOAmount(entry, tjm, customRates), 0);
};