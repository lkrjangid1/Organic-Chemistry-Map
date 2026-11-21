import { SITE, absUrl } from './site';

export const personLd = () => ({
  '@type': 'Person',
  '@id': absUrl('about/#lokesh-jangid'),
  name: SITE.author.name,
  url: absUrl('about/'),
});

export const orgLd = () => ({
  '@type': 'Organization',
  '@id': absUrl('#yaaratech'),
  name: SITE.publisher.name,
  url: absUrl(),
  logo: absUrl('icons/ogm_logo.png'),
});

export const breadcrumbLd = (items: { name: string; path: string }[]) => ({
  '@type': 'BreadcrumbList',
  itemListElement: [{ name: 'Home', path: '' }, ...items].map((item, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: item.name,
    item: absUrl(item.path),
  })),
});

export const faqLd = (faq: { q: string; a: string }[], path: string) =>
  faq.length
    ? {
        '@type': 'FAQPage',
        '@id': absUrl(`${path}#faq`),
        mainEntity: faq.map(({ q, a }) => ({
          '@type': 'Question',
          name: q,
          acceptedAnswer: { '@type': 'Answer', text: a },
        })),
      }
    : null;

export const audienceLd = {
  '@type': 'EducationalAudience',
  educationalRole: 'student',
  audienceType: 'JEE Main, JEE Advanced and NEET aspirants',
};
