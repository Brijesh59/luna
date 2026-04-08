import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { CornerDownLeft } from 'lucide-react'
import { CatMascot } from './CatMascot'

interface InputBarProps {
  onSubmit: (text: string) => void
}

export function InputBar({ onSubmit }: InputBarProps) {
  const [input, setInput] = useState('')
  const [focused, setFocused] = useState(false)
  const ref = useRef<HTMLInputElement>(null)

  const isActive = focused || input.length > 0

  useEffect(() => {
    const handleKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== ref.current) {
        e.preventDefault()
        ref.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  const submit = () => {
    if (input.trim()) {
      onSubmit(input.trim())
      setInput('')
    }
  }

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') submit()
    if (e.key === 'Escape') {
      setInput('')
      ref.current?.blur()
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={`relative bg-white rounded-2xl border transition-all duration-200 ${
          focused
            ? 'border-indigo-300 shadow-[0_0_0_3px_rgba(99,102,241,0.12),0_8px_32px_rgba(99,102,241,0.1)]'
            : 'border-gray-200 shadow-[0_2px_12px_rgba(0,0,0,0.06)]'
        }`}
      >
        {/* Input row */}
        <div className="flex items-center">
          {/* Cat mascot — sleeps/wakes based on typing */}
          <div className="pl-3 pr-1 shrink-0">
            <CatMascot active={isActive} />
          </div>

          <input
            ref={ref}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="What's on your mind?"
            className="flex-1 bg-transparent px-2 py-4 text-[15px] text-gray-700 placeholder:text-gray-400 outline-none"
          />

          {/* Enter hint */}
          <div className="pr-4 flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Enter</span>
            <div className="w-5 h-5 rounded-md bg-gray-100 flex items-center justify-center">
              <CornerDownLeft className="w-3 h-3 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Hints row — slides in on focus */}
        <div
          className={`transition-all duration-200 overflow-hidden ${
            focused ? 'max-h-12 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 border-t border-gray-100 rounded-b-2xl">
            {[
              { symbol: '@', label: 'person' },
              { symbol: '#', label: 'project' },
              { symbol: '!', label: 'priority' },
            ].map(({ symbol, label }) => (
              <button
                key={label}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  const suffix = ` ${symbol}`
                  setInput((prev) => (prev.endsWith(suffix) ? prev : prev + suffix))
                  ref.current?.focus()
                }}
                className="flex items-center gap-1.5 text-[12px] text-gray-400 hover:text-indigo-500 transition-colors select-none"
              >
                <span className="w-5 h-5 flex items-center justify-center bg-white border border-gray-200 rounded text-[11px] font-bold text-gray-500">
                  {symbol}
                </span>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
