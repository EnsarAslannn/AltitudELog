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

  function selectOption(option: ComboboxOption) {
    onChange(option.value)
    setIsOpen(false)
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
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
      setHighlightedIndex((i) => Math.max(i - 1, 0))
      return
    }
    if (event.key === 'Enter' && isOpen && filtered[highlightedIndex]) {
      event.preventDefault()
      selectOption(filtered[highlightedIndex])
    }
  }

  const listboxId = `${inputId}-listbox`
  const showDropdown = isOpen && filtered.length > 0

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1.5">
      <label htmlFor={inputId} className="eyebrow text-[11px] text-slate-500">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        )}
        <input
          id={inputId}
          name={name}
          role="combobox"
          aria-expanded={showDropdown}
          aria-autocomplete="list"
          aria-controls={listboxId}
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
          onKeyDown={handleKeyDown}
          className={cn(
            'w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-[#0b1220] outline-none placeholder:text-slate-400 transition-colors',
            'focus:border-navy-900 focus:ring-4 focus:ring-navy-900/10',
            Icon && 'pl-9',
            hasError ? 'border-red-500' : 'border-slate-300',
          )}
        />
        {showDropdown && (
          <ul
            id={listboxId}
            role="listbox"
            className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-[var(--shadow-card-hover)]"
          >
            {filtered.map((option, index) => (
              <li
                key={option.value}
                role="option"
                aria-selected={index === highlightedIndex}
                onMouseDown={(e) => {
                  e.preventDefault()
                  selectOption(option)
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={cn(
                  'cursor-pointer px-3 py-2 text-sm',
                  index === highlightedIndex ? 'bg-navy-900/5 text-navy-900' : 'text-[#0b1220]',
                )}
              >
                <div className="font-medium">{option.label}</div>
                {option.sublabel && <div className="text-xs text-slate-500">{option.sublabel}</div>}
              </li>
            ))}
          </ul>
        )}
      </div>
      {hasError && <p className="text-xs text-red-600">{errors!.join(', ')}</p>}
    </div>
  )
}
