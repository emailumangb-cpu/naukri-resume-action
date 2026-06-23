import axios from 'axios';
import { uploadFileHeader } from '../utils/headers';
import type { LoginCookies } from '../utils/types';
import { dashboardUrl } from '../utils/constants';

export const fetchProfileId = async (
  cookieHeader: LoginCookies
): Promise<string | null> => {
  try {
    const headers = {
      ...uploadFileHeader(cookieHeader),
      accept: 'application/json',
      appid: '105',
      clientid: 'd3skt0p',
      systemid: 'Naukri',
      authorization: `Bearer ${cookieHeader.nauk_at}`,
      'cache-control': 'no-cache, no-store, must-revalidate',
      pragma: 'no-cache',
      expires: '0'
    };

    const resp = await axios.get(`${dashboardUrl}?t=${Date.now()}`, {
      headers
    });

    if (resp.status !== 200 || !resp.data) {
      return null;
    }

    const data = resp.data as {
      profileId?: string;
      dashBoard?: { profileId?: string };
    };

    return data.profileId ?? data.dashBoard?.profileId ?? null;
  } catch (error) {
    console.error('Failed to fetch profile ID from dashboard:', error);
    return null;
  }
};
