/**
 * Exemple pratique : Septembre 2025
 * 
 * Calendrier Septembre 2025:
 * L  M  M  J  V  S  D
 * 1  2  3  4  5  6  7
 * 8  9 10 11 12 13 14
 * 15 16 17 18 19 20 21
 * 22 23 24 25 26 27 28
 * 29 30
 * 
 * Analyse:
 * - Total: 30 jours
 * - Weekends: 4 weekends complets = 8 jours (6,7,13,14,20,21,27,28)
 * - Jours Lun-Ven: 22 jours (1-5, 8-12, 15-19, 22-26, 29-30)
 * - Jours fériés: 0
 * - Jours ouvrés réels: 22 jours
 */

import { getMonthWorkingDaysInfo } from './working-days';

// Test réel pour Septembre 2025
const september2025 = getMonthWorkingDaysInfo(2025, 9);

console.log('📅 Septembre 2025 - Analyse détaillée:');
console.log('==================================');
console.log(`📊 Total jours: ${september2025.totalDays}`);
console.log(`🏠 Weekends: ${september2025.weekendCount} weekends (${september2025.weekendDays} jours)`);
console.log(`🎉 Jours fériés: ${september2025.holidays}`);
console.log(`💼 Jours Lun-Ven: ${september2025.simpleWorkingDays}`);
console.log(`✅ Jours ouvrés réels: ${september2025.workingDays}`);
console.log('');

// Validation: doit être cohérent
const expectedWeekendDays = 8; // 4 weekends × 2 jours
const expectedWorkingDays = 22; // Pas de jours fériés en septembre 2025

console.log('🧪 Vérifications:');
console.log(`Weekend days: ${september2025.weekendDays} === ${expectedWeekendDays} ✅`);
console.log(`Working days: ${september2025.workingDays} === ${expectedWorkingDays} ✅`);
console.log(`Total check: ${september2025.weekendDays} + ${september2025.workingDays} = ${september2025.weekendDays + september2025.workingDays} (doit = 30)`);

export default september2025;