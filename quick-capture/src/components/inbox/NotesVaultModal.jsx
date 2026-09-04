import React, { useState } from 'react';
import { BookOpen, Search, X, Tag, Trash2 } from 'lucide-react';
import { useQuickCapture } from '../../context/QuickCaptureContext';

export function NotesVaultModal() {
  const { isVaultOpen, setIsVaultOpen, vault } = useQuickCapture();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState(null);

  if (!isVaultOpen) return null;

  // Extract all unique tags
  const allTags = Array.from(
    new Set(vault.flatMap(item => item.tags || []))
  );

  const filteredVault = vault.filter(item => {
    const matchesSearch = (item.title + ' ' + item.content).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = !selectedTag || (item.tags && item.tags.includes(selectedTag));
    return matchesSearch && matchesTag;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in"
      onClick={() => setIsVaultOpen(false)}
    >
      <div
        className="w-full max-w-3xl max-h-[85vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2 font-bold text-lg text-white">
            <BookOpen className="w-5 h-5 text-purple-400" />
            <span>Notes &amp; Ideas Vault</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono">
              {vault.length} items
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsVaultOpen(false)}
            className="p-1 rounded text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Tag Filter Bar */}
        <div className="p-4 border-b border-slate-800 flex flex-col gap-3 bg-slate-950/20">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search reference notes, protocols, and ideas..."
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-400 outline-none focus:border-purple-500"
            />
          </div>

          {allTags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <span className="text-slate-400 mr-1">Tags:</span>
              <button
                type="button"
                onClick={() => setSelectedTag(null)}
                className={`px-2 py-0.5 rounded-full border text-[11px] font-medium transition-colors ${
                  selectedTag === null
                    ? 'bg-purple-500 text-white border-purple-500'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
              >
                All
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  className={`px-2 py-0.5 rounded-full border text-[11px] font-medium transition-colors ${
                    selectedTag === tag
                      ? 'bg-purple-500 text-white border-purple-500'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Grid List of Notes */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredVault.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500">
              <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-40 text-purple-400" />
              <p>No matching notes found in your vault.</p>
            </div>
          ) : (
            filteredVault.map(note => (
              <div
                key={note.id}
                className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between gap-3 hover:border-purple-500/40 transition-colors"
              >
                <div>
                  <h4 className="font-semibold text-white text-sm mb-1">{note.title}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-4">{note.content}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-700/40 text-[11px] text-slate-400">
                  <div className="flex items-center gap-1 flex-wrap">
                    {(note.tags || []).map(t => (
                      <span key={t} className="px-1.5 py-0.2 rounded bg-purple-500/15 text-purple-300 border border-purple-500/20 text-[10px]">
                        #{t}
                      </span>
                    ))}
                  </div>
                  <span>{new Date(note.archivedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
