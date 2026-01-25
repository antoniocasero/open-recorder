'use client';

interface FilterButton {
  id: string;
  label: string;
  icon: string;
}

const filters: FilterButton[] = [
  { id: 'recent', label: 'Recent', icon: 'history' },
  { id: 'transcribed', label: 'Transcribed', icon: 'text_snippet' },
  { id: 'favorites', label: 'Favorites', icon: 'star' },
];

export function SidebarFilters() {
  return (
    <div className="space-y-1">
      {filters.map((filter) => (
        <button
          key={filter.id}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 rounded-lg transition-colors"
          onClick={() => console.log(`Filter: ${filter.id}`)}
        >
          <span className="material-symbols-outlined text-lg">{filter.icon}</span>
          <span>{filter.label}</span>
        </button>
      ))}
    </div>
  );
}