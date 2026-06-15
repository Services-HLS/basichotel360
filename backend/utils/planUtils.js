/**
 * Map frontend / legacy plan names to hotels.plan enum: base | pro | pro_plus
 */
function normalizeHotelPlan(plan) {
  const p = String(plan || '').toLowerCase().trim();
  if (p === 'free' || p === 'basic') return 'base';
  if (p === 'base') return 'base';
  if (p === 'pro') return 'pro';
  if (p === 'pro_plus' || p === 'enterprise') return 'pro_plus';
  return 'base';
}

function isBasicHotelPlan(plan) {
  return normalizeHotelPlan(plan) === 'base';
}

module.exports = { normalizeHotelPlan, isBasicHotelPlan };
