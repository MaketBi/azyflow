import { AnalyticsService } from '../lib/services/analytics.js';

// Test de base du service analytics
console.log('🔍 Test du service Analytics...\n');

async function testAnalytics() {
  try {
    console.log('📊 Test des KPIs freelancers...');
    const freelancerKPIs = await AnalyticsService.getFreelancerKPIs('test-freelancer-id', '2024');
    console.log('Résultats KPIs freelancers:', freelancerKPIs);

    console.log('\n📈 Test évolution revenue...');
    const revenueEvolution = await AnalyticsService.getRevenueEvolution('2024');
    console.log('Évolution revenue:', revenueEvolution);

    console.log('\n🎯 Test répartition clients...');
    const clientDistribution = await AnalyticsService.getClientDistribution('2024');
    console.log('Répartition clients:', clientDistribution);

    console.log('\n🏢 Test analytics entreprise...');
    const companyAnalytics = await AnalyticsService.getCompanyAnalytics('test-company-id', '2024');
    console.log('Analytics entreprise:', companyAnalytics);

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

testAnalytics();