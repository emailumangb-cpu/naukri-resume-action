import axios from 'axios';
import type { AxiosResponse } from 'axios';
import { loginHeaders } from '../utils/headers';
import { loginUrl } from '../utils/constants';
import type { LoginCookies } from '../utils/types';

const extractCookieValue = (cookie: string): string => {
  const eqIndex = cookie.indexOf('=');
  if (eqIndex === -1) return '';
  const afterEq = cookie.substring(eqIndex + 1);
  const semiIndex = afterEq.indexOf(';');
  return semiIndex === -1 ? afterEq.trim() : afterEq.substring(0, semiIndex).trim();
};

const extractCookieObject = (cookies: string[] = []): LoginCookies => {
  let unid = '';
  let nkwap = '';
  let nauk_at = '';
  let nauk_rt = '';
  let nauk_sid = '';

  for (const cookie of cookies) {
    if (cookie.startsWith('MYNAUKRI[UNID]=')) {
      unid = extractCookieValue(cookie);
    } else if (cookie.startsWith('NKWAP=')) {
      nkwap = extractCookieValue(cookie);
    } else if (cookie.startsWith('nauk_at=')) {
      nauk_at = extractCookieValue(cookie);
    } else if (cookie.startsWith('nauk_rt=')) {
      nauk_rt = extractCookieValue(cookie);
    } else if (cookie.startsWith('nauk_sid=')) {
      nauk_sid = extractCookieValue(cookie);
    }
  }

  return { unid, nkwap, nauk_at, nauk_rt, nauk_sid };
};

export const login = async (
  username: string,
  password: string
): Promise<LoginCookies | null> => {
  if (!username || !password) {
    throw new Error('USERNAME and PASSWORD environment variables must be set.');
  }

  try {
    const response: AxiosResponse = await axios.post(
      loginUrl,
      { username, password },
      {
        headers: loginHeaders,
        maxRedirects: 0,
        validateStatus: (status) => status < 400
      }
    );

    let cookies = response.headers['set-cookie'];
    if (cookies) {
      if (typeof cookies === 'string') {
        cookies = [cookies];
      }
      const cookiesData = extractCookieObject(cookies);
      return cookiesData;
    } else {
      console.warn('cookie not found in response.');
      return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Login failed:', error.message);
    throw error;
  }
};
