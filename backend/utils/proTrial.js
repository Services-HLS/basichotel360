/** PRO plan free-trial length in days (single source of truth) */
const PRO_TRIAL_DAYS = 15;

function getProTrialExpiryDate(fromDate = new Date()) {
  const expiry = new Date(fromDate);
  expiry.setDate(expiry.getDate() + PRO_TRIAL_DAYS);
  return expiry;
}

module.exports = { PRO_TRIAL_DAYS, getProTrialExpiryDate };
