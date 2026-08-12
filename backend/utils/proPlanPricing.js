/** Pro subscription amounts (INR) for Basic → Pro upgrades */
const PRO_UPGRADE_PRICES = {
  monthly: {
    billingPeriod: 'monthly',
    amountPaise: 59900,
    amountRupees: 599,
    months: 1,
    label: '1 month',
  },
};

function getUpgradePricing(billingPeriod) {
  // Yearly plan removed — always charge monthly ₹599
  return PRO_UPGRADE_PRICES.monthly;
}

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

module.exports = { PRO_UPGRADE_PRICES, getUpgradePricing, addMonths };
