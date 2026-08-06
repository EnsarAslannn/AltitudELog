import { useEffect, useMemo, useRef, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/cn'

export interface ComboboxOption {
  value: string
  label: string
  sublabel?: string
}

interface ComboboxProps {
  label: string
  name?: string
  id?: string
  value: string
  onChange: (value: string) => void
  options: ComboboxOption[]
  placeholder?: string
  icon?: LucideIcon
  errors?: string[]
  maxLength?: number
  required?: boolean
}

const MAX_RESULTS = 50

export function Combobox({
  label,
  name,
  id,
  value,
  onChange,
  options,
  placeholder,
  icon: Icon,
  errors,
  maxLength,
  required,
}: ComboboxProps) {
  const inputId = id ?? name
  const hasError = !!errors?.length
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const filtered = useMemo(() => {
    const query = value.trim().toLowerCase()
    if (!query) return options.slice(0, MAX_RESULTS)
    return options
      .filter(
        (o) =>
          o.value.toLowerCase().includes(query) ||
          o.label.toLowerCase().includes(query) ||
          o.sublabel?.toLowerCase().includes(query),
      )
      .slice(0, MAX_RESULTS)
  }, [options, value])

  useEffect(() => {
    setHighlightedIndex(0)
  }, [filtered.length, isOpen])

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const listboxId = `${inputId}-listbox`
  const errorId = `${inputId}-error`
  const optionId = (index: number) => `${inputId}-option-${index}`
  const showDropdown = isOpen && filtered.length > 0

  useEffect(() => {
    if (!showDropdown) return

    const active = listRef.current?.querySelector(`#${CSS.escape(optionId(highlightedIndex))}`)
    if (active instanceof HTMLElement && typeof active.scrollIntoView === 'function') {
      active.scrollIntoView({ block: 'nearest' })
    }
  })

  function selectOption(option: ComboboxOption) {
    onChange(option.value)
    setIsOpen(false)
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      if (!isOpen) return
      event.stopPropagation()
      setIsOpen(false)
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setIsOpen(true)
      setHighlightedIndex((i) => Math.min(i + 1, filtered.length - 1))
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setIsOpen(true)
      setHighlightedIndex((i) => Math.max(i - 1, 0))
      return
    }
    if (event.key === 'Enter' && isOpen && filtered[highlightedIndex]) {
      event.preventDefault()
      selectOption(filtered[highlightedIndex])
    }
  }

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1.5">
      <label htmlFor={inputId} className="eyebrow text-[11px] text-on-surface-variant">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
        )}
        <input
          id={inputId}
          name={name}
          role="combobox"
          aria-expanded={showDropdown}
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-activedescendant={showDropdown ? optionId(highlightedIndex) : undefined}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? errorId : undefined}
          autoComplete="off"
          value={value}
          maxLength={maxLength}
          required={required}
          placeholder={placeholder}
          onChange={(e) => {
            onChange(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setIsOpen(false)}
          onKeyDown={handleKeyDown}
          className={cn(
            'w-full rounded border bg-surface-container-lowest px-3 py-2.5 text-sm text-on-surface outline-none placeholder:text-outline transition-colors',
            'focus:border-primary focus:ring-4 focus:ring-primary/15',
            Icon && 'pl-9',
            hasError ? 'border-error' : 'border-outline-variant',
          )}
        />
        {showDropdown && (
          <ul
            id={listboxId}
            ref={listRef}
            role="listbox"
            aria-label={label}
            className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-outline-variant/40 bg-surface-container-lowest py-1 shadow-[var(--shadow-panel-hover)]"
          >
            {filtered.map((option, index) => (
              <li
                key={option.value}
                id={optionId(index)}
                role="option"
                aria-selected={index === highlightedIndex}
                onMouseDown={(e) => {
                  e.preventDefault()
                  selectOption(option)
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={cn(
                  'cursor-pointer px-3 py-2 text-sm',
                  index === highlightedIndex ? 'bg-primary/8 text-primary' : 'text-on-surface',
                )}
              >
                <div className="font-medium">{option.label}</div>
                {option.sublabel && <div className="text-xs text-on-surface-variant">{option.sublabel}</div>}
              </li>
            ))}
          </ul>
        )}
      </div>
      {hasError && (
        <p id={errorId} className="text-xs text-error">
          {errors!.join(', ')}
        </p>
      )}
    </div>
  )
}
