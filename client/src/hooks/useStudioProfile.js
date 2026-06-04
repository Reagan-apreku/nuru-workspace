import { useUser } from '@clerk/react';

/**
 * Central hook to access the photographer's studio profile.
 * Reads from Clerk unsafeMetadata, set during onboarding/profile edits.
 */
export function useStudioProfile() {
  const { user, isLoaded } = useUser();

  if (!isLoaded || !user) {
    return {
      isLoaded: false,
      studioName: 'Nuru Workspace',
      tagline: '',
      location: '',
      website: '',
      logoUrl: null,
      shootTypes: [],
      plan: 'trial',
      planStartDate: null,
      sessionReminders: true,
      autoThankYou: true,
      emailHeader: '',
      emailFooter: '',
      emailGreeting: '',
      brandColor: '',
    };
  }

  const meta = user.unsafeMetadata || {};

  return {
    isLoaded: true,
    studioName: meta.studioName || 'Nuru Workspace',
    tagline: meta.tagline || '',
    location: meta.location || '',
    website: meta.website || '',
    logoUrl: meta.logoUrl || null,
    shootTypes: meta.shootTypes || [],
    plan: meta.plan || 'trial',
    planStartDate: meta.planStartDate || null,
    sessionReminders: meta.sessionReminders !== false,
    autoThankYou: meta.autoThankYou !== false,
    emailHeader: meta.emailHeader || '',
    emailFooter: meta.emailFooter || '',
    emailGreeting: meta.emailGreeting || '',
    brandColor: meta.brandColor || '',
  };
}
