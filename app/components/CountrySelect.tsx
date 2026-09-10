import { COUNTRIES } from '@/lib/data/countries';
import { SearchableSelect } from './SearchableSelect';

export function CountrySelect({ id, className, defaultValue }: { id?: string; className?: string; defaultValue?: string }) {
  return <SearchableSelect
    id={id}
    className={className}
    name="country"
    defaultValue={defaultValue}
    autoComplete="country-name"
    placeholder="Search for your country…"
    emptyMessage="No country matches your search."
    options={COUNTRIES.map((country) => ({ value: country, label: country }))}
    required
  />;
}
