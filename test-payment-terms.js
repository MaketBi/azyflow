/**
 * Script de test pour valider les calculs de délais de paiement français et TVA
 * @author GitHub Copilot
 * @date 24 septembre 2025
 */

import { PaymentTermsHelper } from '../lib/payment-terms-helper.js';

// Test des délais de paiement français
console.log('=== TEST DÉLAIS DE PAIEMENT FRANÇAIS ===\n');

const testDate = new Date('2024-01-15'); // 15 janvier 2024

// Test 1: 30 jours fin de mois
const terms30EndMonth = { days: 30, type: 'end_of_month' as const };
const dueDate30 = PaymentTermsHelper.calculateDueDate(testDate, terms30EndMonth);
console.log(`✅ 30 jours fin de mois depuis le ${testDate.toLocaleDateString('fr-FR')}`);
console.log(`   → Échéance: ${PaymentTermsHelper.formatDueDate(dueDate30)}\n`);

// Test 2: 45 jours fin de mois
const terms45EndMonth = { days: 45, type: 'end_of_month' as const };
const dueDate45 = PaymentTermsHelper.calculateDueDate(testDate, terms45EndMonth);
console.log(`✅ 45 jours fin de mois depuis le ${testDate.toLocaleDateString('fr-FR')}`);
console.log(`   → Échéance: ${PaymentTermsHelper.formatDueDate(dueDate45)}\n`);

// Test 3: 60 jours fin de mois
const terms60EndMonth = { days: 60, type: 'end_of_month' as const };
const dueDate60 = PaymentTermsHelper.calculateDueDate(testDate, terms60EndMonth);
console.log(`✅ 60 jours fin de mois depuis le ${testDate.toLocaleDateString('fr-FR')}`);
console.log(`   → Échéance: ${PaymentTermsHelper.formatDueDate(dueDate60)}\n`);

// Test 4: 30 jours nets
const terms30Net = { days: 30, type: 'net_days' as const };
const dueDate30Net = PaymentTermsHelper.calculateDueDate(testDate, terms30Net);
console.log(`✅ 30 jours nets depuis le ${testDate.toLocaleDateString('fr-FR')}`);
console.log(`   → Échéance: ${PaymentTermsHelper.formatDueDate(dueDate30Net)}\n`);

// Test des calculs TVA
console.log('=== TEST CALCULS TVA FRANÇAISE ===\n');

const workedDays = 10;
const dailyRate = 500; // 500€ TJM
const commissionRate = 15; // 15% commission

// Test 1: Avec TVA 20%
const vatConfigFR = { rate: 20, applicable: true };
const invoiceWithVAT = PaymentTermsHelper.calculateFullInvoice(
  workedDays,
  dailyRate,
  terms30EndMonth,
  vatConfigFR,
  commissionRate
);

console.log(`✅ Calcul avec TVA française (20%)`);
console.log(`   Jours: ${workedDays} × TJM: ${dailyRate}€`);
console.log(`   Commission: ${commissionRate}%`);
console.log(`   ────────────────────────────`);
console.log(`   Montant HT:     ${invoiceWithVAT.amountHT.toFixed(2)}€`);
console.log(`   TVA (20%):      ${invoiceWithVAT.vatAmount.toFixed(2)}€`);
console.log(`   Total TTC:      ${invoiceWithVAT.amountTTC.toFixed(2)}€`);
console.log(`   Commission:    -${invoiceWithVAT.commission.toFixed(2)}€`);
console.log(`   Net freelancer: ${invoiceWithVAT.netAmount.toFixed(2)}€`);
console.log(`   Échéance:       ${PaymentTermsHelper.formatDueDate(invoiceWithVAT.dueDate)}\n`);

// Test 2: Sans TVA
const vatConfigNoVAT = { rate: 0, applicable: false };
const invoiceNoVAT = PaymentTermsHelper.calculateFullInvoice(
  workedDays,
  dailyRate,
  terms30EndMonth,
  vatConfigNoVAT,
  commissionRate
);

console.log(`✅ Calcul sans TVA`);
console.log(`   Jours: ${workedDays} × TJM: ${dailyRate}€`);
console.log(`   Commission: ${commissionRate}%`);
console.log(`   ────────────────────────────`);
console.log(`   Montant HT:     ${invoiceNoVAT.amountHT.toFixed(2)}€`);
console.log(`   TVA:            ${invoiceNoVAT.vatAmount.toFixed(2)}€`);
console.log(`   Total:          ${invoiceNoVAT.amountTTC.toFixed(2)}€`);
console.log(`   Commission:    -${invoiceNoVAT.commission.toFixed(2)}€`);
console.log(`   Net freelancer: ${invoiceNoVAT.netAmount.toFixed(2)}€`);
console.log(`   Échéance:       ${PaymentTermsHelper.formatDueDate(invoiceNoVAT.dueDate)}\n`);

// Test retard de paiement
console.log('=== TEST RETARD DE PAIEMENT ===\n');

const overdueDate = new Date();
overdueDate.setDate(overdueDate.getDate() - 10); // 10 jours en retard

const isOverdue = PaymentTermsHelper.isOverdue(overdueDate);
const daysOverdue = PaymentTermsHelper.getDaysOverdue(overdueDate);

console.log(`✅ Facture avec échéance du ${PaymentTermsHelper.formatDueDate(overdueDate)}`);
console.log(`   En retard: ${isOverdue ? 'OUI' : 'NON'}`);
console.log(`   Jours de retard: ${daysOverdue}\n`);

console.log('=== TESTS TERMINÉS ✅ ===');