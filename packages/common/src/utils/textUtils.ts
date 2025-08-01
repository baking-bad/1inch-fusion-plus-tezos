export const trimSlashes = (value: string): string => {
  const hasFirst = value.startsWith('/');
  const hasLast = value.endsWith('/');

  return hasFirst && hasLast
    ? value.slice(1, -1)
    : hasFirst
      ? value.slice(1)
      : hasLast
        ? value.slice(0, -1)
        : value;
};

const enOrdinalRules = new Intl.PluralRules('en-US', { type: 'ordinal' });
const suffixes = new Map()
  .set('one', 'st')
  .set('two', 'nd')
  .set('few', 'rd')
  .set('other', 'th');

export const formatOrdinals = (value: number): string => {
  const rule = enOrdinalRules.select(value);
  const suffix = suffixes.get(rule) || '';

  return `${value}${suffix}`;
};
