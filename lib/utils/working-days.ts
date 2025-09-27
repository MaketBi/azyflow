/**
 * Utilitaires pour calculer les jours ouvrés
 */

// Jours fériés fixes français
const FIXED_HOLIDAYS = [
  { month: 1, day: 1 },   // Jour de l'An
  { month: 5, day: 1 },   // Fête du Travail
  { month: 5, day: 8 },   // Victoire 1945
  { month: 7, day: 14 },  // Fête Nationale
  { month: 8, day: 15 },  // Assomption
  { month: 11, day: 1 },  // Toussaint
  { month: 11, day: 11 }, // Armistice
  { month: 12, day: 25 }, // Noël
];

// Calcul de Pâques (algorithme de Gauss)
const calculateEaster = (year: number): Date => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  
  return new Date(year, month - 1, day);
};

// Calcul des jours fériés variables basés sur Pâques
const getVariableHolidays = (year: number): Date[] => {
  const easter = calculateEaster(year);
  const holidays: Date[] = [];
  
  // Lundi de Pâques (Pâques + 1 jour)
  const easterMonday = new Date(easter);
  easterMonday.setDate(easter.getDate() + 1);
  holidays.push(easterMonday);
  
  // Ascension (Pâques + 39 jours)
  const ascension = new Date(easter);
  ascension.setDate(easter.getDate() + 39);
  holidays.push(ascension);
  
  // Lundi de Pentecôte (Pâques + 50 jours)
  const whitMonday = new Date(easter);
  whitMonday.setDate(easter.getDate() + 50);
  holidays.push(whitMonday);
  
  return holidays;
};

// Obtenir tous les jours fériés d'une année
const getHolidays = (year: number): Date[] => {
  const holidays: Date[] = [];
  
  // Jours fériés fixes
  FIXED_HOLIDAYS.forEach(holiday => {
    holidays.push(new Date(year, holiday.month - 1, holiday.day));
  });
  
  // Jours fériés variables
  holidays.push(...getVariableHolidays(year));
  
  return holidays;
};

// Vérifier si une date est un jour férié
const isHoliday = (date: Date, holidays: Date[]): boolean => {
  return holidays.some(holiday => 
    holiday.getDate() === date.getDate() &&
    holiday.getMonth() === date.getMonth() &&
    holiday.getFullYear() === date.getFullYear()
  );
};

// Vérifier si une date est un weekend (Samedi ou Dimanche)
const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 = Dimanche, 6 = Samedi
};

/**
 * Calcule le nombre de jours ouvrés dans un mois
 * (exclut les weekends et les jours fériés français)
 */
export const calculateWorkingDays = (year: number, month: number, includeHolidays = true): number => {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const holidays = includeHolidays ? getHolidays(year) : [];
  
  let workingDays = 0;
  
  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    // Exclure les weekends
    if (isWeekend(d)) continue;
    
    // Exclure les jours fériés si demandé
    if (includeHolidays && isHoliday(d, holidays)) continue;
    
    workingDays++;
  }
  
  return workingDays;
};

/**
 * Calcule le nombre de jours ouvrés simples (Lun-Ven uniquement)
 */
export const calculateSimpleWorkingDays = (year: number, month: number): number => {
  return calculateWorkingDays(year, month, false);
};

/**
 * Obtient les informations détaillées sur un mois
 */
export interface MonthWorkingDaysInfo {
  totalDays: number;
  weekendDays: number;     // Nombre de jours de weekend (Sam + Dim)
  weekendCount: number;    // Nombre de weekends complets
  holidays: number;
  workingDays: number;
  simpleWorkingDays: number;
  holidayNames: string[];
}

export const getMonthWorkingDaysInfo = (year: number, month: number): MonthWorkingDaysInfo => {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const totalDays = lastDay.getDate();
  const holidays = getHolidays(year);
  
  let weekendDays = 0;
  let saturdayCount = 0;
  let holidaysInMonth = 0;
  const holidayNames: string[] = [];
  
  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    if (isWeekend(d)) {
      weekendDays++;
      // Compter les samedis pour calculer le nombre de weekends
      if (d.getDay() === 6) { // Samedi
        saturdayCount++;
      }
    }
    
    if (isHoliday(d, holidays)) {
      holidaysInMonth++;
      // Ajouter le nom du jour férié (optionnel)
      holidayNames.push(d.toLocaleDateString('fr-FR'));
    }
  }
  
  const simpleWorkingDays = calculateSimpleWorkingDays(year, month);
  const workingDays = calculateWorkingDays(year, month, true);
  
  return {
    totalDays,
    weekendDays,
    weekendCount: saturdayCount, // Nombre de weekends complets
    holidays: holidaysInMonth,
    workingDays,
    simpleWorkingDays,
    holidayNames
  };
};

/**
 * Valide si un nombre de jours travaillés est raisonnable
 */
export const validateWorkedDays = (workedDays: number, year: number, month: number): {
  isValid: boolean;
  maxDays: number;
  requiresComment: boolean;
  message?: string;
  warning?: string;
} => {
  const maxDays = calculateWorkingDays(year, month, true);
  const simpleDays = calculateSimpleWorkingDays(year, month);
  
  if (workedDays <= 0) {
    return {
      isValid: false,
      maxDays,
      requiresComment: false,
      message: "Le nombre de jours travaillés doit être supérieur à 0"
    };
  }
  
  if (workedDays > maxDays) {
    return {
      isValid: true,
      maxDays,
      requiresComment: true,
      warning: `⚠️ Vous avez saisi ${workedDays} jours alors que ce mois compte seulement ${maxDays} jours ouvrés. Un commentaire est obligatoire pour justifier ce dépassement.`
    };
  }
  
  if (workedDays > simpleDays) {
    return {
      isValid: true,
      maxDays,
      requiresComment: false,
      warning: `Attention: vous avez saisi ${workedDays} jours, mais ce mois ne compte que ${simpleDays} jours ouvrables (Lun-Ven). Vérifiez si vous avez travaillé un jour férié.`
    };
  }
  
  return {
    isValid: true,
    maxDays,
    requiresComment: false
  };
};