import type { LoginCookies } from '../utils/types';
import { updateProfileFields } from './updateProfileFields';

export const updateResumeHeadline = async (
  cookieHeader: LoginCookies,
  profileId: string,
  headline: string
): Promise<boolean> => {
  return updateProfileFields(cookieHeader, profileId, {
    resumeHeadline: headline
  });
};
