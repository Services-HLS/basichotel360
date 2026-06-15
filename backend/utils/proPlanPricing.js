/** Pro subscription amounts (INR) for Basic → Pro upgrades */
const PRO_UPGRADE_PRICES = {
  monthly: {
    billingPeriod: 'monthly',
    amountPaise: 49900,
    amountRupees: 499,
    months: 1,
    label: '1 month',
  },
  yearly: {
    billingPeriod: 'yearly',
    amountPaise: 478800,
    amountRupees: 4788,
    months: 12,
    label: '1 year',
  },
};

function getUpgradePricing(billingPeriod) {
  const key = billingPeriod === 'yearly' ? 'yearly' : 'monthly';
  return PRO_UPGRADE_PRICES[key];
}

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

module.exports = { PRO_UPGRADE_PRICES, getUpgradePricing, addMonths };
