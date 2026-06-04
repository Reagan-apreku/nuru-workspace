import { useUser } from '@clerk/react';

const TRIAL_DAYS = 30;

/**
 * Returns trial status: daysLeft, isExpired, plan, and trialEndDate.
 */
export function useTrialStatus() {
  const { user, isLoaded } = useUser();

  if (!isLoaded || !user) {
    return { isLoaded: false, plan: 'trial', daysLeft: TRIAL_DAYS, isExpired: false, trialEndDate: null };
  }

  const meta = user.unsafeMetadata || {};
  const plan = meta.plan || 'trial';
  const cancelAtPeriodEnd = meta.cancelAtPeriodEnd === true;

  if (plan === 'pro' && cancelAtPeriodEnd) {
    const startDate = meta.planStartDate ? new Date(meta.planStartDate) : new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 30); // 30-day billing cycle

    const now = new Date();
    const msLeft = endDate - now;
    const daysLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
    const isExpired = daysLeft <= 0;

    if (isExpired) {
      return { isLoaded: true, plan: 'trial', daysLeft: 0, isExpired: true, trialEndDate: endDate.toISOString(), cancelAtPeriodEnd };
    } else {
      return { isLoaded: true, plan: 'pro', daysLeft, isExpired: false, trialEndDate: endDate.toISOString(), cancelAtPeriodEnd };
    }
  }

  // Active uncancelled Pro and Lifetime users are never expired
  if (plan === 'pro' || plan === 'lifetime') {
    return { isLoaded: true, plan, daysLeft: null, isExpired: false, trialEndDate: null, cancelAtPeriodEnd: false };
  }

  const startDate = meta.planStartDate ? new Date(meta.planStartDate) : new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + TRIAL_DAYS);

  const now = new Date();
  const msLeft = endDate - now;
  const daysLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));

  return {
    isLoaded: true,
    plan: 'trial',
    daysLeft,
    isExpired: daysLeft <= 0,
    trialEndDate: endDate.toISOString(),
  };
}
