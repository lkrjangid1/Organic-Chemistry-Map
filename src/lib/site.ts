export const SITE = {
  name: 'Organic Chemistry Map',
  tagline: 'Organic chemistry for JEE Main, JEE Advanced & NEET',
  locale: 'en_IN',
  lang: 'en-IN',
  themeColor: '#0f172a',
  repo: 'https://github.com/lkrjangid1/Organic-Chemistry-Map',
  author: {
    name: 'Lokesh Jangid',
    byline: 'Notes by Lokesh Jangid, based on classroom lectures',
  },
  publisher: {
    name: 'YaaraTech',
    credit: 'Website by YaaraTech team',
  },
  libgen: {
    name: 'Libgen: EPUB & PDF Library',
    line: 'Free EPUB & PDF reader by YaaraTech',
    url: 'https://play.google.com/store/apps/details?id=com.yaaratech.libgen',
  },
  // Google Form link for error reports (set REPORT_FORM_URL + REPORT_FORM_PAGE_FIELD when the form exists).
  reportForm: import.meta.env.REPORT_FORM_URL as string | undefined,
  reportFormPageField: import.meta.env.REPORT_FORM_PAGE_FIELD as string | undefined,
  cfAnalyticsToken: import.meta.env.CF_ANALYTICS_TOKEN as string | undefined,
  googleVerification: import.meta.env.GOOGLE_SITE_VERIFICATION as string | undefined,
  // Optional Google sign-in (Firebase). Web config values are public by design; the site
  // shows sign-in only when all four are set.
  firebase: {
    apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY as string | undefined,
    authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN as string | undefined,
    projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID as string | undefined,
    appId: import.meta.env.PUBLIC_FIREBASE_APP_ID as string | undefined,
  },
} as const;

export const EXAMS = {
  'jee-main': 'JEE Main',
  'jee-advanced': 'JEE Advanced',
  neet: 'NEET',
} as const;

export type ExamKey = keyof typeof EXAMS;

/** Prefixes a site-relative path with the configured base. */
export const url = (path = '') => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const clean = path.replace(/^\//, '');
  return `${base}/${clean}`;
};

/** Absolute URL for canonical/OG/JSON-LD. */
export const absUrl = (path = '') => new URL(url(path), import.meta.env.SITE).href;
