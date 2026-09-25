/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Flame,
  Trophy,
  Clock,
  Heart,
  Zap,
  Sparkles,
  Search,
  SkipForward,
  RotateCcw,
} from 'lucide-react';
import { EndlessState, EndlessType } from '../types/chemistry';

interface EndlessModeHUDProps {
  state: EndlessState;
  onChangeType: (type: EndlessType) => void;
  onUseOctetScan: () => void;
  onUseBondSpark: () => void;
  onSkipMolecule: () => void;
  onRestart: () => void;
  sparkAvailable: boolean;
  scanAvailable: boolean;
  isHardMode?: boolean;
  onToggleHardMode?: () => void;
}

export const EndlessModeHUD: React.FC<EndlessModeHUDProps> = ({
  state,
  onChangeType,
  onUseOctetScan,
  onUseBondSpark,
  onSkipMolecule,
  onRestart,
  sparkAvailable,
  scanAvailable,
  isHardMode = false,
  onToggleHardMode,
}) => {
  const isTimeCritical = state.type === 'blitz' && state.timeLeft <= 10;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col gap-3">
      {/* Top Header: Mode Switcher & Wave Number */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => onChangeType('blitz')}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                state.type === 'blitz'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Timed Blitz
            </button>
            <button
              onClick={() => onChangeType('streak')}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                state.type === 'streak'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              3-Lives Survival
            </button>
          </div>

          {onToggleHardMode && (
            <button
              onClick={onToggleHardMode}
              className={`px-2.5 py-1 rounded-md font-bold text-xs border transition-all flex items-center gap-1 cursor-pointer ${
                isHardMode
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/60 shadow-xs'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
              title="Exam Mode hides valence numbers and charge hints, granting double points"
            >
              <Flame className={`w-3 h-3 ${isHardMode ? 'text-rose-400 animate-pulse' : 'text-slate-500'}`} />
              <span>Exam Mode (2x pts)</span>
            </button>
          )}

          <div className="text-xs text-slate-400 hidden sm:block">
            Wave <span className="text-white font-mono font-bold text-sm">#{state.wave}</span>
          </div>
        </div>

        {/* High Score & Restart */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-amber-400 bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-500/30">
            <Trophy className="w-3.5 h-3.5" />
            <span className="font-mono font-bold tabular-nums">{state.highScore}</span>
            <span className="text-[10px] text-amber-300 uppercase">Best</span>
          </div>

          <button
            onClick={onRestart}
            className="flex items-center gap-1 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Restart Endless Run"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Primary Game Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* 1. Live Score */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5 flex flex-col justify-between">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Score
          </span>
          <div className="text-xl font-black text-cyan-400 font-mono tabular-nums">
            {state.score}
          </div>
        </div>

        {/* 2. Streak & Multiplier */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Streak
            </span>
            {state.multiplier > 1 && (
              <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/20 px-1 rounded">
                x{state.multiplier.toFixed(1)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-base font-bold text-white font-mono">
            <Flame className={`w-4 h-4 ${state.streak > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-600'}`} />
            <span>{state.streak}</span>
            <span className="text-xs text-slate-400 font-normal">compounds</span>
          </div>
        </div>

        {/* 3. Timer (Blitz) or Lives (Streak) */}
        {state.type === 'blitz' ? (
          <div
            className={`border rounded-lg p-2.5 flex flex-col justify-between transition-colors ${
              isTimeCritical
                ? 'bg-rose-950/50 border-rose-500/80 animate-pulse'
                : 'bg-slate-950/70 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3 text-cyan-400" />
                Time Remaining
              </span>
              <span className="text-[10px] text-cyan-400">+15s / win</span>
            </div>
            <div
              className={`text-xl font-black font-mono tabular-nums ${
                isTimeCritical ? 'text-rose-400' : 'text-white'
              }`}
            >
              {Math.max(0, state.timeLeft)}s
            </div>
          </div>
        ) : (
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5 flex flex-col justify-between">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Lives Remaining
            </span>
            <div className="flex items-center gap-1.5 text-base">
              {[1, 2, 3].map((heartIndex) => (
                <Heart
                  key={heartIndex}
                  className={`w-5 h-5 transition-transform ${
                    heartIndex <= state.lives
                      ? 'text-rose-500 fill-rose-500 scale-100'
                      : 'text-slate-700 fill-slate-800 scale-90'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* 4. Solved Count */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5 flex flex-col justify-between">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Compounds Solved
          </span>
          <div className="text-xl font-bold text-emerald-400 font-mono tabular-nums">
            {state.moleculesSolved}
          </div>
        </div>
      </div>

      {/* Tactical Power-Ups Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Assists:
          </span>

          {/* Ion Spark Ability */}
          <button
            onClick={onUseBondSpark}
            disabled={!sparkAvailable}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
              sparkAvailable
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30'
                : 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed opacity-50'
            }`}
            title="Auto-transfer electrons into one anion octet"
          >
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Ion Spark (1)</span>
          </button>

          {/* Octet Scan Ability */}
          <button
            onClick={onUseOctetScan}
            disabled={!scanAvailable || isHardMode}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
              scanAvailable && !isHardMode
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed opacity-50'
            }`}
            title={isHardMode ? 'Octet Scan is locked in Exam Mode' : 'Inspect incomplete ions and charge diagnostic hints'}
          >
            <Search className="w-3.5 h-3.5 text-amber-400" />
            <span>{isHardMode ? 'Octet Scan (Locked)' : 'Octet Scan'}</span>
          </button>
        </div>

        {/* Skip Compound button */}
        <button
          onClick={onSkipMolecule}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-slate-400 hover:text-rose-300 hover:bg-rose-950/30 border border-slate-800 hover:border-rose-900/60 transition-colors"
          title={state.type === 'blitz' ? 'Skip compound (-10s penalty)' : 'Skip compound (-1 Life penalty)'}
        >
          <SkipForward className="w-3.5 h-3.5" />
          <span>Skip ({state.type === 'blitz' ? '-10s' : '-1 Life'})</span>
        </button>
      </div>
    </div>
  );
};
