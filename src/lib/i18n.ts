/**
 * Two site languages: English (default, no prefix) and Hindi under /hi/.
 * Hindi pages use Devanagari with English technical terms.
 */
export type Lang = 'en' | 'hi';

/** Language of the page being rendered, from its URL. */
export const langOf = (u: URL): Lang => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return u.pathname.slice(base.length).replace(/^\//, '').startsWith('hi/') || u.pathname.slice(base.length) === '/hi' ? 'hi' : 'en';
};

export const HTML_LANG: Record<Lang, string> = { en: 'en-IN', hi: 'hi-IN' };
export const OG_LOCALE: Record<Lang, string> = { en: 'en_IN', hi: 'hi_IN' };

const STRINGS = {
  en: {
    home: 'Home',
    keyPoint: 'Key point',
    memoryTrick: 'Memory trick',
    examTip: 'Exam tip',
    commonMistake: 'Common mistake',
    references: 'References',
    verifiedAgainst: (n: number) => `Verified against ${n} sources`,
    checkedAgainst: 'Checked against the sources below',
    lastChecked: 'last checked',
    underReview: 'Under review',
    alsoCalled: 'Also called',
    faq: 'Frequently asked questions',
    reportError: 'Report an error on this page',
    reagents: 'Reagents',
    reagent: 'Reagent',
    positiveResult: 'Positive result',
    distinguishes: 'Distinguishes',
    conditions: 'Conditions',
    substrate: 'Substrate',
    product: 'Product',
    byproducts: 'By-products',
    type: 'Type',
    partOf: 'Part of',
    seeOnMap: 'See it on the map',
    compounds: 'Compounds',
    relatedPages: 'Related pages',
    explore: 'Explore',
    allOf: (label: string) => `All ${label.toLowerCase()}`,
    reactionsAZ: 'Reactions A–Z',
    interactiveMap: 'Interactive reaction map',
    otherLang: 'हिंदी में पढ़ें',
    byline: 'Notes by Lokesh Jangid, based on classroom lectures',
    credit: 'Website by YaaraTech team',
    notebookPage: 'notebook p.',
    updated: 'Updated',
    libgenLabel: 'From YaaraTech',
    libgenSmall: 'Read your chemistry books on Android.',
    skip: 'Skip to content',
    menu: 'Menu',
    openMap: 'Open map',
    tools: 'Tools',
  },
  hi: {
    home: 'होम',
    keyPoint: 'मुख्य बिंदु',
    memoryTrick: 'याद रखने की ट्रिक',
    examTip: 'Exam टिप',
    commonMistake: 'आम गलती',
    references: 'संदर्भ (References)',
    verifiedAgainst: (n: number) => `${n} स्रोतों से जाँचा गया`,
    checkedAgainst: 'नीचे दिए गए स्रोतों से जाँचा गया',
    lastChecked: 'अंतिम जाँच',
    underReview: 'समीक्षा में',
    alsoCalled: 'दूसरे नाम',
    faq: 'अक्सर पूछे जाने वाले प्रश्न',
    reportError: 'इस पेज में गलती बताएँ',
    reagents: 'Reagents',
    reagent: 'Reagent',
    positiveResult: 'Positive result',
    distinguishes: 'किनमें अंतर करता है',
    conditions: 'Conditions',
    substrate: 'Substrate',
    product: 'Product',
    byproducts: 'By-products',
    type: 'प्रकार',
    partOf: 'इसका हिस्सा',
    seeOnMap: 'Map पर देखें',
    compounds: 'Compounds',
    relatedPages: 'संबंधित पेज',
    explore: 'और देखें',
    allOf: (label: string) => `सभी ${label}`,
    reactionsAZ: 'Reactions A–Z',
    interactiveMap: 'Interactive reaction map',
    otherLang: 'Read in English',
    byline: 'नोट्स: Lokesh Jangid, classroom lectures पर आधारित',
    credit: 'Website: YaaraTech team',
    notebookPage: 'नोटबुक पेज',
    updated: 'अपडेट',
    libgenLabel: 'YaaraTech की ओर से',
    libgenSmall: 'अपनी chemistry की किताबें Android पर पढ़ें।',
    skip: 'मुख्य सामग्री पर जाएँ',
    menu: 'Menu',
    openMap: 'Map खोलें',
    tools: 'Tools',
  },
} as const;

export type Strings = (typeof STRINGS)['en'];
export const t = (lang: Lang): Strings => STRINGS[lang] as unknown as Strings;

/** Date in the page language. */
export const fmtDate = (d: Date | undefined, lang: Lang) =>
  d?.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
