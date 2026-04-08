export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 select-none">
      {/* Spinner icon */}
      <div className="w-20 h-20 rounded-2xl bg-indigo-50 flex items-center justify-center mb-7 shadow-sm">
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <path
            d="M18 6V30M18 6L10 14M18 6L26 14"
            stroke="#818cf8"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M8 22H28" stroke="#c7d2fe" strokeWidth="2" strokeLinecap="round" />
          <path d="M11 27H25" stroke="#e0e7ff" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>

      <h2 className="text-xl font-bold text-gray-800 mb-2">Clear your head</h2>
      <p className="text-[14px] text-gray-500 text-center max-w-xs leading-relaxed mb-8">
        FocusFlow is your minimalist companion for deep work. Start by typing a task or an idea above.
      </p>

      <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-4">
        Try typing
      </div>

      <div className="space-y-2.5 text-left">
        {[
          { icon: '🔔', text: 'Call Sarah tomorrow 10am', tag: 'urgent', tagColor: 'text-red-500' },
          { icon: '💡', text: 'Review design docs', tag: '#marketing', tagColor: 'text-indigo-500' },
          { icon: '💡', text: 'Idea: New sidebar layout', tag: '', tagColor: '' },
        ].map((ex, i) => (
          <div key={i} className="flex items-center gap-2.5 text-[13px] text-gray-500">
            <span className="text-base">{ex.icon}</span>
            <span>{ex.text}</span>
            {ex.tag && (
              <span className={`text-[11px] font-semibold ${ex.tagColor}`}>{ex.tag}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
