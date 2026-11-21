/**
 * Progressive enhancement for the static home page: live filtering of the
 * reaction index. The page is fully usable (and crawlable) without this.
 */

const input = document.getElementById('rxn-filter') as HTMLInputElement | null;
const empty = document.getElementById('rxn-empty');
const groups = Array.from(document.querySelectorAll<HTMLElement>('.idx-group'));
const letterNav = document.querySelector<HTMLElement>('.letter-nav');

const applyFilter = (rawQuery: string) => {
  const terms = rawQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
  let visibleTotal = 0;

  for (const group of groups) {
    let visibleInGroup = 0;
    for (const item of Array.from(group.querySelectorAll<HTMLElement>('.rxn'))) {
      const haystack = item.dataset.search ?? '';
      const match = terms.every((term) => haystack.includes(term));
      item.hidden = !match;
      if (match) visibleInGroup += 1;
    }
    group.hidden = visibleInGroup === 0;
    visibleTotal += visibleInGroup;
  }

  if (empty) empty.hidden = visibleTotal > 0;
  if (letterNav) letterNav.hidden = terms.length > 0;
};

if (input) {
  input.addEventListener('input', () => applyFilter(input.value));
}

export {};
