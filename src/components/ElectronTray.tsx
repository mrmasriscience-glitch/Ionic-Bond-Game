/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Eraser, Lightbulb, Eye, EyeOff, CheckCircle2, ArrowRight, Shuffle, RotateCcw, Sparkles } from 'lucide-react';
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
  onShuffleSymbols?: () => void;
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
  onShuffleSymbols,
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

  // Group cations and anions
  const cationAtoms = molecule.atoms.filter((a) => a.role === 'cation');
  const anionAtoms = molecule.atoms.filter((a) => a.role === 'anion');

  const donorMetal = cationAtoms[0];
  const receiverNonMetal = anionAtoms[0];

  const donorSymbol: ElectronType = (donorMetal && atomSymbols?.[donorMetal.id]) || 'dot';
  const receiverSymbol: ElectronType = (receiverNonMetal && atomSymbols?.[receiverNonMetal.id]) || (donorSymbol === 'dot' ? 'cross' : 'dot');

  // Count how many electrons are currently on cations vs anions
  let cationOuterElectronsCount = 0;
  let anionOuterElectronsCount = 0;
  let transferredElectronsOnAnions = 0;

  placedElectrons.forEach((e) => {
    let closestAtom = molecule.atoms[0];
    let minDist = Infinity;
    molecule.atoms.forEach((a) => {
      const d = Math.hypot(e.x - a.x, e.y - a.y);
      if (d < minDist) {
        minDist = d;
        closestAtom = a;
      }
    });

    if (closestAtom.role === 'cation') {
      cationOuterElectronsCount++;
    } else {
      anionOuterElectronsCount++;
      if (e.type === donorSymbol) {
        transferredElectronsOnAnions++;
      }
    }
  });

  const totalNeededTransfers = molecule.electronsTransferred;
  const transferProgressPct = Math.min(100, Math.round((transferredElectronsOnAnions / totalNeededTransfers) * 100));

  const handleDragStart = (e: React.DragEvent, type: ElectronType) => {
    e.dataTransfer.setData('text/plain', type);
    onSelectTool(type);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-xl flex flex-col gap-2.5">
      {/* Top Header of the Tray */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            {isHardMode ? 'Electron Toolbox' : 'Guided Transfer Center'}
          </h2>
          {isHardMode ? (
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-400 bg-rose-950/60 border border-rose-500/40 px-1.5 py-0.2 rounded">
              Exam Mode (Place Outer Rings)
            </span>
          ) : (
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 border border-cyan-500/40 px-1.5 py-0.2 rounded flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Drag Across Mode
            </span>
          )}
        </div>

        {/* Action Toggles */}
        <div className="flex items-center gap-1.5">
          {onShuffleSymbols && (
            <button
              onClick={onShuffleSymbols}
              className="flex items-center gap-1 px-2 py-0.5 text-xs rounded font-medium transition-colors border text-slate-400 hover:text-cyan-300 bg-slate-800/80 border-slate-700/60 hover:border-cyan-500/40 cursor-pointer"
              title="Randomize whether left or right atom uses dots vs crosses"
            >
              <Shuffle className="w-3 h-3 text-cyan-400" />
              <span className="hidden sm:inline">Shuffle Symbols</span>
            </button>
          )}

          {!isHardMode ? (
            <button
              onClick={onToggleHints}
              className={`flex items-center gap-1 px-2 py-0.5 text-xs rounded font-medium transition-colors border cursor-pointer ${
                showHints
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-800/80 border-slate-700/60'
              }`}
              title="Toggle faint target outlines showing expected placement"
            >
              {showHints ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              <span>Hints</span>
            </button>
          ) : (
            <div className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              Exam Hints Off
            </div>
          )}
        </div>
      </div>

      {/* BODY CONTENT: GUIDED MODE (Drag Transfer) vs EXAM MODE (Manual Outer Rings) */}
      {!isHardMode ? (
        /* GUIDED MODE: DRAG TRANSFER TRACKER */
        <div className="flex flex-col gap-2">
          {/* Transfer Progress Bar */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2.5 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <span>Transfer Progress:</span>
                <span className="font-mono text-cyan-300 font-bold tabular-nums">
                  {transferredElectronsOnAnions} / {totalNeededTransfers} e⁻
                </span>
              </span>
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                transferredElectronsOnAnions >= totalNeededTransfers
                  ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300'
                  : 'bg-cyan-950/60 border border-cyan-500/30 text-cyan-300'
              }`}>
                {transferredElectronsOnAnions >= totalNeededTransfers ? 'Complete ✓' : `${totalNeededTransfers - transferredElectronsOnAnions} left to drag`}
              </span>
            </div>

            {/* Progress track */}
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  transferredElectronsOnAnions >= totalNeededTransfers
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                    : 'bg-gradient-to-r from-cyan-500 to-amber-400'
                }`}
                style={{ width: `${transferProgressPct}%` }}
              />
            </div>

            <p className="text-[11px] text-slate-400 leading-snug">
              {transferredElectronsOnAnions >= totalNeededTransfers ? (
                <span className="text-emerald-300 font-medium">
                  ✓ Transfer complete! Outer metal shell emptied; non-metal octet of 8 filled.
                </span>
              ) : (
                <span>
                  Click and <strong className="text-cyan-300">drag</strong> the metal&apos;s outer{' '}
                  <strong className={donorSymbol === 'dot' ? 'text-cyan-300' : 'text-amber-300'}>
                    {donorSymbol === 'dot' ? 'dot (●)' : 'cross (✖)'}
                  </strong>{' '}
                  across into the open vacancy on {receiverNonMetal?.element.name || 'non-metal'}.
                </span>
              )}
            </p>
          </div>

          {/* Atom Role Inference Cards */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Donor Metal Card */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-2 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white truncate">
                  {donorMetal?.element.name} ({donorMetal?.element.symbol})
                </span>
                <span className="text-[9px] font-mono uppercase bg-slate-900 text-slate-400 px-1 rounded">
                  Donor Metal
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className="text-slate-400">Inner Symbol:</span>
                <span className={`font-bold font-mono ${donorSymbol === 'dot' ? 'text-cyan-400' : 'text-amber-400'}`}>
                  {donorSymbol === 'dot' ? '● Dot' : '✖ Cross'}
                </span>
              </div>
              <div className="text-[10px] text-slate-400">
                {cationOuterElectronsCount === 0 ? (
                  <span className="text-emerald-400 font-semibold">✓ Shell Emptied ([{donorMetal?.element.symbol}]⁺)</span>
                ) : (
                  <span>{cationOuterElectronsCount} outer e⁻ to transfer</span>
                )}
              </div>
            </div>

            {/* Acceptor Non-Metal Card */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-2 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white truncate">
                  {receiverNonMetal?.element.name} ({receiverNonMetal?.element.symbol})
                </span>
                <span className="text-[9px] font-mono uppercase bg-slate-900 text-slate-400 px-1 rounded">
                  Acceptor Non-Metal
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className="text-slate-400">Inner Symbol:</span>
                <span className={`font-bold font-mono ${receiverSymbol === 'dot' ? 'text-cyan-400' : 'text-amber-400'}`}>
                  {receiverSymbol === 'dot' ? '● Dot' : '✖ Cross'}
                </span>
              </div>
              <div className="text-[10px] text-slate-400">
                {anionOuterElectronsCount >= 8 ? (
                  <span className="text-emerald-400 font-semibold">✓ Octet 8 e⁻ Formed</span>
                ) : (
                  <span>{8 - anionOuterElectronsCount} open vacancy slot(s)</span>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* EXAM MODE: MANUAL OUTER RINGS PLACEMENT TOOLBOX */
        <div className="grid grid-cols-3 gap-2">
          {/* 1. DOT TOOL (●) */}
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
                <p className="text-[10px] text-cyan-300 truncate" title="Infer from inner shell dots">
                  {donorSymbol === 'dot' ? `${donorMetal?.element.name} e⁻` : `${receiverNonMetal?.element.name} e⁻`}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0 ml-1">
              <span className="text-sm font-bold font-mono tabular-nums text-cyan-300">
                {placedDots}
              </span>
              <span className="text-[9px] text-slate-500 block leading-none">placed</span>
            </div>
          </div>

          {/* 2. CROSS TOOL (✖) */}
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
                <p className="text-[10px] text-amber-300 truncate" title="Infer from inner shell crosses">
                  {donorSymbol === 'cross' ? `${donorMetal?.element.name} e⁻` : `${receiverNonMetal?.element.name} e⁻`}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0 ml-1">
              <span className="text-sm font-bold font-mono tabular-nums text-amber-300">
                {placedCrosses}
              </span>
              <span className="text-[9px] text-slate-500 block leading-none">placed</span>
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
              className="text-[10px] text-slate-400 hover:text-rose-300 px-1.5 py-0.5 rounded bg-slate-900/60 hover:bg-rose-950/60 border border-slate-700/60 hover:border-rose-800/60 transition-colors shrink-0 ml-1 cursor-pointer"
              title="Remove all placed electrons from outer rings"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Helper Bar / Action Footer */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60 text-xs">
        <div className="text-[11px] text-slate-400 truncate">
          {isHardMode ? (
            <span className="text-rose-400 font-mono text-[10px]">
              Click outer rings to place e⁻ · Leave metal outer ring emptied ([M]ⁿ⁺)
            </span>
          ) : (
            <span className="text-cyan-300 font-medium text-[11px] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              Drag the outer electron across the gap
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {!isHardMode ? (
            <>
              {onLoadNeutralAtoms && (
                <button
                  onClick={onLoadNeutralAtoms}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700/60 text-[11px] transition-colors cursor-pointer"
                  title="Reset atoms back to neutral state to re-try dragging electrons"
                >
                  <RotateCcw className="w-3 h-3 text-cyan-400" />
                  <span>Reset Drag</span>
                </button>
              )}

              <button
                onClick={onProvideStepHint}
                className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 text-[11px] transition-colors cursor-pointer"
                title="Transfer one electron across as a demonstration"
              >
                <Lightbulb className="w-3 h-3 text-amber-400" />
                <span>Demo Transfer</span>
              </button>

              <button
                onClick={onAutoSolve}
                className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 text-[11px] transition-colors cursor-pointer"
                title="Automatically reveal the completed ionic dot and cross diagram"
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Solve</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClearElectrons}
                className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700/60 text-[11px] transition-colors cursor-pointer"
                title="Clear outer rings"
              >
                <RotateCcw className="w-3 h-3 text-rose-400" />
                <span>Clear Rings</span>
              </button>

              <button
                onClick={onProvideStepHint}
                className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 text-[11px] transition-colors cursor-pointer"
              >
                <Lightbulb className="w-3 h-3 text-amber-400" />
                <span>Hint</span>
              </button>

              <button
                onClick={onAutoSolve}
                className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 text-[11px] transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Solve</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
