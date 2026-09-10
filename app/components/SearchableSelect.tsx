'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';

export type SearchableOption = {
  value: string;
  label: string;
  searchText?: string;
};

type SearchableSelectProps = {
  options: SearchableOption[];
  name?: string;
  id?: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
  autoComplete?: string;
  required?: boolean;
  disabled?: boolean;
  onChange?: (value: string) => void;
};

export function SearchableSelect({
  options,
  name,
  id,
  value,
  defaultValue = '',
  placeholder = 'Search and select…',
  emptyMessage = 'No matching options.',
  className = '',
  autoComplete,
  required = false,
  disabled = false,
  onChange,
}: SearchableSelectProps) {
  const generatedId = useId();
  const inputId = id || `searchable-select-${generatedId.replace(/:/g, '')}`;
  const listId = `${inputId}-options`;
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const controlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const selectedValue = controlled ? value : internalValue;
  const uniqueOptions = useMemo(() => {
    const seen = new Set<string>();
    return options.filter((option) => {
      if (!option.value || seen.has(option.value)) return false;
      seen.add(option.value);
      return true;
    });
  }, [options]);
  const selectedOption = uniqueOptions.find((option) => option.value === selectedValue);
  const filteredOptions = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return uniqueOptions;
    return uniqueOptions.filter((option) =>
      `${option.label} ${option.value} ${option.searchText || ''}`.toLowerCase().includes(needle),
    );
  }, [query, uniqueOptions]);

  useEffect(() => {
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick);
  }, []);

  useEffect(() => {
    const form = rootRef.current?.closest('form');
    if (!form || controlled) return;
    const reset = () => {
      setInternalValue(defaultValue);
      setQuery('');
      setOpen(false);
    };
    form.addEventListener('reset', reset);
    return () => form.removeEventListener('reset', reset);
  }, [controlled, defaultValue]);

  function choose(option: SearchableOption) {
    if (!controlled) setInternalValue(option.value);
    onChange?.(option.value);
    setQuery('');
    setOpen(false);
    inputRef.current?.focus();
  }

  return (
    <div ref={rootRef} className={`searchable-select ${className}`.trim()}>
      <select
        className="searchable-select-native"
        name={name}
        value={selectedValue}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        tabIndex={-1}
        aria-hidden="true"
        onChange={() => undefined}
        onInvalid={(event) => {
          event.preventDefault();
          setOpen(true);
          inputRef.current?.focus();
        }}
      >
        <option value="" />
        {uniqueOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <input
        ref={inputRef}
        id={inputId}
        className="searchable-select-input"
        value={open ? query : selectedOption?.label || ''}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={open}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setOpen(false);
            setQuery('');
          } else if (event.key === 'ArrowDown') {
            event.preventDefault();
            setOpen(true);
          } else if (event.key === 'Enter' && open && filteredOptions.length) {
            event.preventDefault();
            choose(filteredOptions[0]);
          }
        }}
      />
      <button
        className="searchable-select-toggle"
        type="button"
        disabled={disabled}
        aria-label="Toggle options"
        aria-expanded={open}
        onClick={() => {
          setQuery('');
          setOpen((current) => !current);
          inputRef.current?.focus();
        }}
      >
        <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m6 8 4 4 4-4" /></svg>
      </button>
      {open && !disabled ? (
        <div id={listId} className="searchable-select-options" role="listbox">
          {filteredOptions.length ? filteredOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === selectedValue}
              className={option.value === selectedValue ? 'selected' : ''}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(option)}
            >
              <span>{option.label}</span>
            </button>
          )) : <p>{emptyMessage}</p>}
        </div>
      ) : null}
    </div>
  );
}
