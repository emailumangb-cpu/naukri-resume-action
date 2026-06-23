// Login URL
export const loginUrl =
  'https://www.naukri.com/central-login-services/v1/login';

// Resume upload URL
export const resumeUploadUrl = 'https://filevalidation.naukri.com/file';

// Resume Update URL

export const resumeUpdateUrl = (profileId: string) => {
  return `https://www.naukri.com/cloudgateway-mynaukri/resman-aggregator-services/v0/users/self/profiles/${profileId}/advResume`;
};

// Dashboard URL used to resolve the active profile ID after login
export const dashboardUrl =
  'https://www.naukri.com/cloudgateway-mynaukri/resman-aggregator-services/v0/users/self/dashboard';

// Profile update URL for summary, headline, and other profile fields
export const profileUpdateUrl =
  'https://www.naukri.com/cloudgateway-mynaukri/resman-aggregator-services/v1/users/self/fullprofiles';

// Alias kept for backward compatibility
export const resumeHeadlineUrl = profileUpdateUrl;
