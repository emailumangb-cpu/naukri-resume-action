import axios from 'axios';
import type { LoginCookies } from '../utils/types';
import { resumeHeadlineUrl } from '../utils/constants';

export const MIN_SUMMARY_LENGTH = 50;
export const MAX_SUMMARY_LENGTH = 5000;
export const MAX_HEADLINE_LENGTH = 1000;

export interface ProfileFieldUpdates {
  summary?: string;
  resumeHeadline?: string;
}

const buildProfileUpdateHeaders = (cookieHeader: LoginCookies) => {
  const cookieString = `MYNAUKRI[UNID]=${cookieHeader.unid}; NKWAP=${cookieHeader.nkwap}; nauk_at=${cookieHeader.nauk_at}; nauk_rt=${cookieHeader.nauk_rt}; nauk_sid=${cookieHeader.nauk_sid}`;

  return {
    accept: 'application/json',
    'accept-language': 'en-US,en;q=0.9',
    'content-type': 'application/json',
    origin: 'https://www.naukri.com',
    referer: 'https://www.naukri.com/mnjuser/profile?id=&altresid',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'sec-ch-ua': '"Not/A)Brand";v="99", "Google Chrome";v="126", "Chromium";v="126"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    appid: '105',
    systemid: '105',
    clientid: 'd3skt0p',
    authorization: `Bearer ${cookieHeader.nauk_at}`,
    'x-http-method-override': 'PUT',
    'x-requested-with': 'XMLHttpRequest',
    'cache-control': 'no-cache, no-store, must-revalidate',
    pragma: 'no-cache',
    expires: '0',
    Cookie: cookieString
  };
};

export const normalizeHeadline = (
  headline: string
): { value: string; truncated: boolean } => {
  const trimmed = headline.trim();
  if (trimmed.length <= MAX_HEADLINE_LENGTH) {
    return { value: trimmed, truncated: false };
  }

  return {
    value: trimmed.slice(0, MAX_HEADLINE_LENGTH).trimEnd(),
    truncated: true
  };
};

const isSuccessfulResponse = (status: number, data: unknown): boolean => {
  if (status < 200 || status >= 300) {
    return false;
  }

  if (data && typeof data === 'object') {
    const payload = data as Record<string, unknown>;
    const statusValue = payload.status ?? payload.success ?? payload.error;

    if (statusValue === false || statusValue === 'failure') {
      return false;
    }

    if (typeof statusValue === 'string' && /fail|error/i.test(statusValue)) {
      return false;
    }
  }

  return true;
};

export const updateProfileFields = async (
  cookieHeader: LoginCookies,
  profileId: string,
  fields: ProfileFieldUpdates
): Promise<boolean> => {
  const profile: Record<string, string> = {};

  if (fields.summary !== undefined) {
    profile.summary = fields.summary;
  }

  if (fields.resumeHeadline !== undefined) {
    profile.resumeHeadline = fields.resumeHeadline;
  }

  if (Object.keys(profile).length === 0) {
    return false;
  }

  try {
    const data = {
      profile,
      profileId
    };

    console.log('Updating profile fields:', Object.keys(profile).join(', '));
    console.log('Profile update payload:', JSON.stringify({ profile, profileId }));

    const resp = await axios.post(
      `${resumeHeadlineUrl}?t=${Date.now()}`,
      data,
      { headers: buildProfileUpdateHeaders(cookieHeader) }
    );

    console.log('Profile update response status:', resp.status);
    console.log('Profile update response data:', JSON.stringify(resp.data));

    if (!isSuccessfulResponse(resp.status, resp.data)) {
      console.error('Profile field update failed:', resp.status, JSON.stringify(resp.data));
      return false;
    }

    console.log('Profile fields updated successfully!');
    return true;
  } catch (error) {
    const axiosError = error as { response?: { status: number; data: unknown }; message?: string; config?: { url?: string; method?: string } };
    if (axiosError.response) {
      console.error(
        'Error in updateProfileFields:',
        'Status:', axiosError.response.status,
        'Data:', JSON.stringify(axiosError.response.data)
      );
    } else {
      console.error('Error in updateProfileFields:', axiosError.message ?? error);
    }
    return false;
  }
};
