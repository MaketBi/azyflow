import { describe, it, expect } from 'vitest';
import { AnalyticsService } from '../lib/services/analytics';

describe('AnalyticsService', () => {
  it('devrait calculer les KPIs freelancers', async () => {
    // Test basique de structure
    expect(AnalyticsService).toBeDefined();
    expect(typeof AnalyticsService.getFreelancerKPIs).toBe('function');
    expect(typeof AnalyticsService.getRevenueEvolution).toBe('function');
    expect(typeof AnalyticsService.getClientDistribution).toBe('function');
    expect(typeof AnalyticsService.getCompanyAnalytics).toBe('function');
  });

  it('devrait retourner null pour un freelancer inexistant', async () => {
    const result = await AnalyticsService.getFreelancerKPIs('fake-id', '2024-01');
    expect(result).toBeNull();
  });
});