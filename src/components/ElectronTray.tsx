/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Eraser, Lightbulb, Eye, EyeOff, CheckCircle2, ArrowRight } from 'lucide-react';
import { MoleculeDefinition, ElectronType, PlacedElectron } from '../types/chemistry';

interface ElectronTrayProps {
  molecule: MoleculeDefinition;
  placedElectrons: PlacedElectron[];
  activeTool: 'dot' | 'cross' | 'eraser';
  onSelectTool: (tool: 'dot' | 'cross' | 'eraser') => void;
  showHints: boolean;
  onToggleHints: () => void;
  onClearElectrons: () => void;
  onProvideStepHint: () => void;
  onAutoSolve: () => void;
  onLoadNeutralAtoms?: () => void;
  isCompleted: boolean;
  isHardMode?: boolean;
  atomSymbols?: Record<string, ElectronType>;
  expectedDots?: number;
  expectedCrosses?: number;
}

export const ElectronTray: React.FC<ElectronTrayProps> = ({
  molecule,
  placedElectrons,
  activeTool,
  onSelectTool,
  showHints,
  onToggleHints,
  onClearElectrons,
  onProvideStepHint,
  onAutoSolve,
  onLoadNeutralAtoms,
  isCompleted,
  isHardMode = false,
  atomSymbols,
  expectedDots,
  expectedCrosses,
}) => {
  let placedDots = 0;
  let placedCrosses = 0;
  placedElectrons.forEach((e) => {
    if (e.type === 'dot') placedDots++;
    if (e.type === 'cross') placedCrosses++;
  });

  const effectiveExpectedDots = expectedDots ?? molecule.expectedTotalDots;
  const effectiveExpectedCrosses = expectedCrosses ?? molecule.expectedTotalCrosses;

  const remainingDots = Math.max(0, effectiveExpectedDots - placedDots);
  const remainingCrosses = Math.max(0, effectiveExpectedCrosses - placedCrosses);

  // Group cations and anions for clear tool labelling
  const metalAtoms = molecule.atoms.filter((a) => a.role === 'cation');
  const nonMetalAtoms = molecule.atoms.filter((a) => a.role === 'anion');

  const metalLabel = metalAtoms.map((a) => a.element.name).filter((v, i, a) => a.indexOf(v) === i).join(', ');
  const nonMetalLabel = nonMetalAtoms.map((a) => a.element.name).filter((v, i, a) => a.indexOf(v) === i).join(', ');

  const handleDragStart = (e: React.DragEvent, type: ElectronType) => {
    e.dataTransfer.setData('text/plain', type);
    onSelectTool(type);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-xl flex flex-col gap-2.5">
      {/* Top Header of the Tray */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">Electron Toolbox</h2>
          {isHardMode ? (
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-400 bg-rose-950/60 border border-rose-500/40 px-1.5 py-0.2 rounded">
              Exam Mode
            </span>
          ) : (
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Click or drag onto atom orbits
            </span>
          )}
        </div>

        {/* Hints & Quick Toggles */}
        {!isHardMode ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={onToggleHints}
              className={`flex items-center gap-1 px-2 py-0.5 text-xs rounded font-medium transition-colors border ${
                showHints
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-800/80 border-slate-700/60'
              }`}
              title="Toggle faint target outlines showing expected placement"
            >
              {showHints ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              <span>Hints</span>
            </button>
          </div>
        ) : (
          <div className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            Hints Off
          </div>
        )}
      </div>

      {/* Main Electron Picker Cards */}
      <div className="grid grid-cols-3 gap-2">
        {/* 1. DOT TOOL (●) - Metal electrons */}
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, 'dot')}
          onClick={() => onSelectTool('dot')}
          className={`cursor-pointer rounded-lg p-2 border transition-all flex items-center justify-between select-none ${
            activeTool === 'dot'
              ? 'bg-cyan-950/60 border-cyan-500/80 shadow-md ring-1 ring-cyan-500/40'
              : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-md bg-cyan-900/60 border border-cyan-500/40 flex items-center justify-center shrink-0">
              <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/80 inline-block" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-white">Dot (●)</span>
              </div>
              <p className="text-[10px] text-cyan-300 truncate">
                {isHardMode ? 'Metal e⁻' : `${metalLabel || 'Metal'} e⁻`}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0 ml-1">
            <span className="text-sm font-bold font-mono tabular-nums text-cyan-300">
              {isHardMode ? placedDots : remainingDots}
            </span>
            <span className="text-[9px] text-slate-500 block leading-none">{isHardMode ? 'placed' : 'left'}</span>
          </div>
        </div>

        {/* 2. CROSS TOOL (✖) - Non-metal electrons */}
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, 'cross')}
          onClick={() => onSelectTool('cross')}
          className={`cursor-pointer rounded-lg p-2 border transition-all flex items-center justify-between select-none ${
            activeTool === 'cross'
              ? 'bg-amber-950/60 border-amber-500/80 shadow-md ring-1 ring-amber-500/40'
              : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-md bg-amber-900/60 border border-amber-500/40 flex items-center justify-center shrink-0">
              <span className="text-sm font-black text-amber-400 leading-none">✕</span>
            </div>
            <div className="truncate">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-white">Cross (✖)</span>
              </div>
              <p className="text-[10px] text-amber-300 truncate">
                {isHardMode ? 'Non-Metal e⁻' : `${nonMetalLabel || 'Non-metal'} e⁻`}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0 ml-1">
            <span className="text-sm font-bold font-mono tabular-nums text-amber-300">
              {isHardMode ? placedCrosses : remainingCrosses}
            </span>
            <span className="text-[9px] text-slate-500 block leading-none">{isHardMode ? 'placed' : 'left'}</span>
          </div>
        </div>

        {/* 3. ERASER & ACTIONS */}
        <div
          onClick={() => onSelectTool('eraser')}
          className={`cursor-pointer rounded-lg p-2 border transition-all flex items-center justify-between select-none ${
            activeTool === 'eraser'
              ? 'bg-rose-950/50 border-rose-500/80 shadow-md ring-1 ring-rose-500/40'
              : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-md bg-rose-900/40 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <Eraser className="w-3.5 h-3.5" />
            </div>
            <div className="truncate">
              <span className="text-xs font-bold text-white block">Eraser</span>
              <span className="text-[10px] text-slate-400 truncate block">Remove</span>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClearElectrons();
            }}
            className="text-[10px] text-slate-400 hover:text-rose-300 px-1.5 py-0.5 rounded bg-slate-900/60 hover:bg-rose-950/60 border border-slate-700/60 hover:border-rose-800/60 transition-colors shrink-0 ml-1"
            title="Remove all placed electrons from canvas"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Helper Bar / Step Assist */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60 text-xs">
        <div className="text-[11px] text-slate-400 truncate">
          {isHardMode ? (
            <span className="text-rose-400 font-mono text-[10px]">
              Metal loses e⁻ to form [M]ⁿ⁺ · Non-metal gains e⁻ to form [X]ⁿ⁻.
            </span>
          ) : (
            <span className="truncate">
              Transfer metal dots (●) into non-metal octet (✖).
            </span>
          )}
        </div>

        {!isHardMode && (
          <div className="flex items-center gap-1.5 shrink-0">
            {onLoadNeutralAtoms && (
              <button
                onClick={onLoadNeutralAtoms}
                className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700/60 text-[11px] transition-colors"
                title="Fill starting neutral atoms to practice electron transfer"
              >
                <span>Reset Atoms</span>
              </button>
            )}

            <button
              onClick={onProvideStepHint}
              className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 text-[11px] transition-colors"
            >
              <Lightbulb className="w-3 h-3 text-amber-400" />
              <span>Hint</span>
            </button>

            <button
              onClick={onAutoSolve}
              className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 text-[11px] transition-colors"
              title="Automatically reveal the completed ionic dot and cross diagram"
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Solve</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
