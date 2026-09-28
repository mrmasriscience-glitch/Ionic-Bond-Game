/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { MOLECULES } from '../data/molecules';
import { MoleculeDefinition } from '../types/chemistry';
import { CheckCircle2, ChevronRight, Search, Zap, Sparkles, Filter } from 'lucide-react';

interface MoleculeSelectorProps {
  currentMolecule: MoleculeDefinition;
  onSelectMolecule: (molecule: MoleculeDefinition) => void;
  completedMolecules: Set<string>;
}

export const MoleculeSelector: React.FC<MoleculeSelectorProps> = ({
  currentMolecule,
  onSelectMolecule,
  completedMolecules,
}) => {
  const [filterLevel, setFilterLevel] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const levels = [
    { id: 'beginner', label: '1:1 Ratio · Binary Transfer', count: 16, tag: 'Beginner' },
    { id: 'intermediate', label: '1:2 & 2:1 Ratios · Multi-Ion Balance', count: 15, tag: 'Intermediate' },
    { id: 'advanced', label: '1:3 & 2:3 Ratios · Complex Charges', count: 5, tag: 'Advanced' },
  ] as const;

  const filteredMolecules = useMemo(() => {
    return MOLECULES.filter((m) => {
      const matchesLevel = filterLevel === 'all' || m.level === filterLevel;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.formula.toLowerCase().includes(q) ||
        m.bondTypeSummary.toLowerCase().includes(q);
      return matchesLevel && matchesSearch;
    });
  }, [filterLevel, searchQuery]);

  const percentMastered = Math.round((completedMolecules.size / MOLECULES.length) * 100);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-xl flex flex-col gap-4">
      {/* Header with Title and Overall Mastery Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Ionic Compounds Curriculum</span>
            </h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 font-bold">
              {MOLECULES.length} Compounds
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Choose any compound to build its complete dot-and-cross diagram, balance charges, and explore its 3D crystal lattice
          </p>
        </div>

        {/* Progress Tracker */}
        <div className="flex flex-col sm:items-end gap-1 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-cyan-400">
              {completedMolecules.size} of {MOLECULES.length} Mastered
            </span>
            <span className="text-[11px] font-mono text-slate-400 font-semibold">({percentMastered}%)</span>
          </div>
          <div className="w-36 sm:w-44 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/60">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${percentMastered}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setFilterLevel('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterLevel === 'all'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Filter className="w-3 h-3" />
            <span>All ({MOLECULES.length})</span>
          </button>
          <button
            onClick={() => setFilterLevel('beginner')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterLevel === 'beginner'
                ? 'bg-indigo-500 text-white shadow-md font-bold'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <span>1:1 Binary</span>
            <span className="text-[10px] opacity-75 font-mono">(16)</span>
          </button>
          <button
            onClick={() => setFilterLevel('intermediate')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterLevel === 'intermediate'
                ? 'bg-purple-500 text-white shadow-md font-bold'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <span>1:2 & 2:1 Multi-Ion</span>
            <span className="text-[10px] opacity-75 font-mono">(15)</span>
          </button>
          <button
            onClick={() => setFilterLevel('advanced')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterLevel === 'advanced'
                ? 'bg-rose-500 text-white shadow-md font-bold'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <span>1:3 & 2:3 Complex</span>
            <span className="text-[10px] opacity-75 font-mono">(5)</span>
          </button>
        </div>

        {/* Quick Search */}
        <div className="relative min-w-[200px] sm:min-w-[240px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search 36 compounds (e.g. CaO, CaCl₂, Al₂O₃)..."
            className="w-full bg-slate-950/80 border border-slate-700 text-slate-200 text-xs rounded-lg pl-8 pr-3 py-1.5 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-white bg-slate-800 px-1 rounded cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Compound Cards Grid */}
      <div className="flex flex-col gap-4 overflow-y-auto max-h-[480px] pr-1.5 custom-scrollbar">
        {filterLevel === 'all' && !searchQuery ? (
          // Display Grouped by Level
          levels.map((lvl) => {
            const groupMolecules = MOLECULES.filter((m) => m.level === lvl.id);
            return (
              <div key={lvl.id} className="flex flex-col gap-2">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-1">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    {lvl.label}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 font-semibold">
                    {groupMolecules.filter((m) => completedMolecules.has(m.id)).length} / {groupMolecules.length} Solved
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {groupMolecules.map((m) => {
                    const globalIdx = MOLECULES.findIndex((mol) => mol.id === m.id);
                    const isCurrent = m.id === currentMolecule.id;
                    const isCompleted = completedMolecules.has(m.id);

                    return (
                      <button
                        key={m.id}
                        onClick={() => onSelectMolecule(m)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between group ${
                          isCurrent
                            ? 'bg-cyan-950/80 border-cyan-400 shadow-md ring-2 ring-cyan-400/40'
                            : isCompleted
                            ? 'bg-slate-800/60 border-emerald-500/30 hover:border-emerald-500/60 hover:bg-slate-800'
                            : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center shrink-0 font-mono transition-transform group-hover:scale-105 ${
                              isCurrent
                                ? 'bg-cyan-400 text-slate-950 font-black'
                                : isCompleted
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                                : 'bg-slate-800 text-slate-200 border border-slate-700 font-semibold'
                            }`}
                          >
                            <span className="text-xs font-bold leading-tight">{m.formula}</span>
                            <span className="text-[8px] opacity-75">#{globalIdx + 1}</span>
                          </div>

                          <div className="truncate">
                            <div className="text-xs font-semibold text-white truncate flex items-center gap-1.5">
                              <span>{m.name}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                              <span>{m.bondTypeSummary}</span>
                            </div>
                            <div className="text-[9.5px] font-mono text-cyan-400/90 truncate flex items-center gap-1 mt-0.5">
                              <Zap className="w-2.5 h-2.5 shrink-0" />
                              <span>{m.electronsTransferred} e⁻ transfer</span>
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 ml-1.5">
                          {isCompleted ? (
                            <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-sm">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </div>
                          ) : (
                            <ChevronRight
                              className={`w-4 h-4 text-slate-600 group-hover:text-slate-300 transition-colors ${
                                isCurrent ? 'text-cyan-400' : ''
                              }`}
                            />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        ) : (
          // Display Filtered List
          <div>
            {filteredMolecules.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800/80">
                <p className="text-sm text-slate-400">No compounds match "{searchQuery}"</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterLevel('all');
                  }}
                  className="mt-2 text-xs text-cyan-400 hover:underline font-semibold cursor-pointer"
                >
                  Reset filter to view all 36 compounds
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {filteredMolecules.map((m) => {
                  const globalIdx = MOLECULES.findIndex((mol) => mol.id === m.id);
                  const isCurrent = m.id === currentMolecule.id;
                  const isCompleted = completedMolecules.has(m.id);

                  return (
                    <button
                      key={m.id}
                      onClick={() => onSelectMolecule(m)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between group ${
                        isCurrent
                          ? 'bg-cyan-950/80 border-cyan-400 shadow-md ring-2 ring-cyan-400/40'
                          : isCompleted
                          ? 'bg-slate-800/60 border-emerald-500/30 hover:border-emerald-500/60 hover:bg-slate-800'
                          : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center shrink-0 font-mono transition-transform group-hover:scale-105 ${
                            isCurrent
                              ? 'bg-cyan-400 text-slate-950 font-black'
                              : isCompleted
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                              : 'bg-slate-800 text-slate-200 border border-slate-700 font-semibold'
                          }`}
                        >
                          <span className="text-xs font-bold leading-tight">{m.formula}</span>
                          <span className="text-[8px] opacity-75">#{globalIdx + 1}</span>
                        </div>

                        <div className="truncate">
                          <div className="text-xs font-semibold text-white truncate">
                            {m.name}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate mt-0.5">
                            {m.bondTypeSummary}
                          </div>
                          <div className="text-[9.5px] font-mono text-cyan-400/90 truncate flex items-center gap-1 mt-0.5">
                            <Zap className="w-2.5 h-2.5 shrink-0" />
                            <span>{m.electronsTransferred} e⁻ transfer</span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 ml-1.5">
                        {isCompleted ? (
                          <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-sm">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <ChevronRight
                            className={`w-4 h-4 text-slate-600 group-hover:text-slate-300 transition-colors ${
                              isCurrent ? 'text-cyan-400' : ''
                            }`}
                          />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
