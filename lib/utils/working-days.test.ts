/**
 * Tests pour la validation des jours ouvrés
 */
import { 
  calculateWorkingDays, 
  calculateSimpleWorkingDays,
  validateWorkedDays,
  getMonthWorkingDaysInfo 
} from './working-days';

// Tests d'exemple - vous pouvez les exécuter en console
console.group('🧪 Tests de validation des jours ouvrés');

// Test Septembre 2025 (mois actuel)
const sep2025 = getMonthWorkingDaysInfo(2025, 9);
console.log('📅 Septembre 2025:', sep2025);
console.log('🔍 Détail Septembre 2025:');
console.log(`   - ${sep2025.totalDays} jours au total`);
console.log(`   - ${sep2025.weekendCount} weekends complets (${sep2025.weekendDays} jours de weekend)`);
console.log(`   - ${sep2025.holidays} jour(s) férié(s)`);
console.log(`   - ${sep2025.simpleWorkingDays} jours Lun-Ven`);
console.log(`   - ${sep2025.workingDays} jours ouvrés réels`);

// Test Janvier 2024
const jan2024 = getMonthWorkingDaysInfo(2024, 1);
console.log('📅 Janvier 2024:', jan2024);

// Test Mai 2024 (avec jour férié le 1er et 8 mai)
const may2024 = getMonthWorkingDaysInfo(2024, 5);
console.log('📅 Mai 2024 (avec fériés):', may2024);

console.groupEnd();

// Exemples concrets pour 2024-2025
export const EXAMPLES_2024_2025 = {
  // Janvier 2024: 1er janvier = jour férié
  'janvier-2024': {
    totalDays: 31,
    simpleWorkingDays: 23,  // Lun-Ven
    workingDays: 22,        // Lun-Ven sauf 1er janvier
    holidays: ['2024-01-01'] // Jour de l'An
  },
  
  // Mai 2024: 1er mai + 8 mai + Ascension + Pentecôte
  'mai-2024': {
    totalDays: 31,
    simpleWorkingDays: 23,  // Lun-Ven  
    workingDays: 19,        // Lun-Ven sauf 4 jours fériés
    holidays: ['2024-05-01', '2024-05-08', '2024-05-09', '2024-05-20'] 
  },
  
  // Août 2024: seulement 15 août
  'aout-2024': {
    totalDays: 31,
    simpleWorkingDays: 22,  // Lun-Ven
    workingDays: 21,        // Lun-Ven sauf 15 août
    holidays: ['2024-08-15'] // Assomption
  },
  
  // Décembre 2024: seulement 25 décembre
  'decembre-2024': {
    totalDays: 31,
    simpleWorkingDays: 22,  // Lun-Ven
    workingDays: 21,        // Lun-Ven sauf 25 décembre
    holidays: ['2024-12-25'] // Noël
  }
};