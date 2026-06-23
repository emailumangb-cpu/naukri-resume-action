import type { LoginCookies } from './types';

export const loginHeaders = {
  accept: 'application/json',
  'accept-language': 'en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7',
  appid: '109',
  'cache-control': 'no-cache',
  clientid: 'd3skt0p',
  'content-type': 'application/json',
  gid: 'LOCATION,INDUSTRY,EDUCATION,FAREA_ROLE',
  pragma: 'no-cache',
  priority: 'u=1, i',
  nkparam:
    'oFYlsMP9SN/18UTJyWR0J4Far8aGlf/RgiTehgjzAfodyCTha++NVMb+jAOJjH4rULRVnn65HS1K0dD3clyVyQ==',
  'sec-ch-ua':
    '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-origin',
  'x-requested-with': 'XMLHttpRequest',
  'user-agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/114.0.5735.198 Safari/537.36',
  systemid: 'jobseeker',
  Referer: 'https://www.naukri.com/',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
};

export const uploadFileHeader = (cookieHeader: LoginCookies) => {
  // Create cookie string from the LoginCookies object
  const cookieString = `MYNAUKRI[UNID]=${cookieHeader.unid}; NKWAP=${cookieHeader.nkwap}; nauk_at=${cookieHeader.nauk_at}; nauk_rt=${cookieHeader.nauk_rt}; nauk_sid=${cookieHeader.nauk_sid}`;

  const uploadHeader = {
    accept: 'application/json, text/javascript, */*; q=0.01',
    'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
    appid: '109',
    origin: 'https://www.naukri.com',
    priority: 'u=1, i',
    referer: 'https://www.naukri.com/',
    'sec-ch-ua':
      '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
    'sec-ch-ua-mobile': '?0',
    'cache-control': 'no-cache',
    clientid: 'd3skt0p',
    // 'content-type': 'application/json',
    'sec-ch-ua-platform': '"macOS"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-site',
    systemid: 'fileupload',
    'user-agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    Cookie: cookieString // Now passing a string instead of an object
  };
  return uploadHeader;
};
