/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MOLECULES } from '../data/molecules';
import { MoleculeDefinition } from '../types/chemistry';
import { CheckCircle2, ChevronRight } from 'lucide-react';

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
  const levels = [
    { id: 'beginner', label: '1:1 Ratio · Binary Transfer' },
    { id: 'intermediate', label: '1:2 & 2:1 Ratios · Multi-Ion Balance' },
    { id: 'advanced', label: '1:3 & 2:3 Ratios · Complex Charge Neutrality' },
  ] as const;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div>
          <h2 className="text-sm font-semibold text-slate-200">Ionic Compounds Curriculum</h2>
          <p className="text-xs text-slate-400">Choose a compound to construct its ionic dot-and-cross diagram</p>
        </div>
        <span className="text-xs font-mono text-cyan-400">
          {completedMolecules.size} / {MOLECULES.length} Mastered
        </span>
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto max-h-[360px] pr-1">
        {levels.map((lvl) => {
          const groupMolecules = MOLECULES.filter((m) => m.level === lvl.id);
          return (
            <div key={lvl.id} className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                {lvl.label}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {groupMolecules.map((m) => {
                  const isCurrent = m.id === currentMolecule.id;
                  const isCompleted = completedMolecules.has(m.id);

                  return (
                    <button
                      key={m.id}
                      onClick={() => onSelectMolecule(m)}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between group ${
                        isCurrent
                          ? 'bg-cyan-950/70 border-cyan-400 shadow-md ring-1 ring-cyan-400/40'
                          : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 font-mono ${
                            isCurrent
                              ? 'bg-cyan-400 text-slate-950'
                              : isCompleted
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {m.formula}
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-semibold text-white truncate">
                            {m.name}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {m.bondTypeSummary}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 ml-1.5">
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <ChevronRight
                            className={`w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition-colors ${
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
        })}
      </div>
    </div>
  );
};
