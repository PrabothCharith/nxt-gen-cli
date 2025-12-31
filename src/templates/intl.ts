export const messagesEn = `{
  "Index": {
    "title": "Hello world!"
  }
}
`;

export const i18nConfig = `import {notFound} from 'next/navigation';
import {getRequestConfig} from 'next-intl/server';
 
// Can be imported from a shared config
const locales = ['en', 'es', 'de'];
 
export default getRequestConfig(async ({locale}) => {
  // Validate that the incoming \`locale\` parameter is valid
  if (!locales.includes(locale as any)) notFound();
 
  return {
    messages: (await import(\`../../messages/\${locale}.json\`)).default
  };
});
`;

export const intlMiddleware = `import createMiddleware from 'next-intl/middleware';
 
export default createMiddleware({
  // A list of all locales that are supported
  locales: ['en', 'dk', 'de'],
 
  // Used when no locale matches
  defaultLocale: 'en'
});
 
export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(de|en|dk)/:path*']
};
`;
