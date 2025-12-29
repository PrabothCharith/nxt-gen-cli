export const i18nRequest = `
import {getRequestConfig} from 'next-intl/server';
 
export default getRequestConfig(async () => {
  // Provide a static locale, fetch a user setting,
  // read from \`cookies()\`, \`headers()\`, etc.
  const locale = 'en';
 
  return {
    locale,
    messages: (await import(\`../../messages/\${locale}.json\`)).default
  };
});
`;

export const i18nMiddleware = `
import createMiddleware from 'next-intl/middleware';
 
export default createMiddleware({
  // A list of all locales that are supported
  locales: ['en', 'de'],
 
  // Used when no locale matches
  defaultLocale: 'en'
});
 
export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(de|en)/:path*']
};
`;

export const englishMessages = `
{
  "HomePage": {
    "title": "Hello world!",
    "about": "Go to the about page"
  }
}
`;

export const germanMessages = `
{
  "HomePage": {
    "title": "Hallo Welt!",
    "about": "Zur Über uns Seite"
  }
}
`;
