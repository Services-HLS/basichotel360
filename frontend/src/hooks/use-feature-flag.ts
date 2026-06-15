import { useMemo } from 'react';

export type FeatureFlag = 
  | 'financial_reports'
  | 'advanced_analytics'
  | 'maintenance_mode'
  | 'booking_actions'
  | 'export_data'
  | 'unlimited_rooms'
  | 'advanced_reports'
  | 'daily_revenue'
  | 'occupancy_rate';

export const useFeatureFlag = (feature: FeatureFlag) => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const userPlan = currentUser?.plan || 'basic';
  
  const featureFlags: Record<FeatureFlag, boolean> = useMemo(() => ({
    'financial_reports': userPlan === 'pro',
    'advanced_analytics': userPlan === 'pro',
    'maintenance_mode': userPlan === 'pro',
    'booking_actions': userPlan === 'pro',
    'export_data': userPlan === 'pro',
    'unlimited_rooms': userPlan === 'pro',
    'advanced_reports': userPlan === 'pro',
    'daily_revenue': userPlan === 'pro',
    'occupancy_rate': userPlan === 'pro',
  }), [userPlan]);
  
  return featureFlags[feature];
};