import type { LoginCookies } from '../utils/types';
import { updateProfileFields } from './updateProfileFields';

/**
 * Update the jobseeker profile summary via the fullprofiles endpoint.
 */
export const updateProfileSummary = async (
  cookieHeader: LoginCookies,
  profileId: string,
  summary: string
): Promise<boolean> => {
  return updateProfileFields(cookieHeader, profileId, { summary });
};
