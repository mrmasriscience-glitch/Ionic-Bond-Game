/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Volume2, VolumeX, RotateCcw, Sparkles, Shield, Flame } from 'lucide-react';

interface NavbarProps {
  activeTab: 'builder' | 'endless' | 'guide' | 'periodictable' | 'viewer3d';
  onSelectTab: (tab: 'builder' | 'endless' | 'guide' | 'periodictable' | 'viewer3d') => void;
  onResetMolecule: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  completedCount: number;
  totalMolecules: number;
  isHardMode: boolean;
  onToggleHardMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onResetMolecule,
  soundEnabled,
  onToggleSound,
  completedCount,
  totalMolecules,
  isHardMode,
  onToggleHardMode,
}) => {
  return (
    <header className="flex items-center justify-between px-4 sm:px-6 py-2 sm:py-2.5 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
      {/* Zone 1: Wordmark */}
      <div className="flex items-center gap-2.5">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('builder');
          }}
          className="text-base sm:text-lg font-bold tracking-tight text-white hover:text-cyan-400 transition-colors flex items-center gap-2"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50" />
          <span>Ionic Bond Lab</span>
        </a>
        <span className="text-[11px] text-slate-500 hidden md:inline">
          Dot & Cross Series
        </span>
      </div>

      {/* Zone 2: Navigation links */}
      <nav className="flex items-center gap-1 sm:gap-1.5">
        <button
          onClick={() => onSelectTab('builder')}
          className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'builder'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          Curriculum
        </button>
        <button
          onClick={() => onSelectTab('endless')}
          className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'endless'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span>Endless</span>
        </button>
        <button
          onClick={() => onSelectTab('viewer3d')}
          className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'viewer3d'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          3D Lattice
        </button>
        <button
          onClick={() => onSelectTab('guide')}
          className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap hidden sm:block ${
            activeTab === 'guide'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          Guide
        </button>
        <button
          onClick={() => onSelectTab('periodictable')}
          className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap hidden sm:block ${
            activeTab === 'periodictable'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          Ion Table
        </button>
      </nav>

      {/* Zone 3: Primary actions & indicators */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={onToggleHardMode}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
            isHardMode
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm shadow-rose-500/20'
              : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-700'
          }`}
          title={
            isHardMode
              ? 'Exam Mode is ON: Valence limits & charge hints are hidden. Click to switch to Guided Mode.'
              : 'Click to enable Exam Mode (Hides valence counts and charge hints for test practice)'
          }
        >
          {isHardMode ? (
            <>
              <Flame className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <span>Exam Mode</span>
            </>
          ) : (
            <>
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Guided Mode</span>
              <span className="sm:hidden">Guided</span>
            </>
          )}
        </button>

        <div className="hidden lg:flex items-center gap-1.5 text-xs font-medium text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-mono tabular-nums text-slate-200">{completedCount}/{totalMolecules}</span>
          <span>Mastered</span>
        </div>

        <button
          onClick={onToggleSound}
          title={soundEnabled ? 'Mute Sound Effects' : 'Enable Sound Effects'}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          aria-label="Toggle Sound"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-600" />}
        </button>

        {activeTab === 'builder' && (
          <button
            onClick={onResetMolecule}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700/60 transition-colors whitespace-nowrap"
            title="Reset current ionic diagram"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        )}
      </div>
    </header>
  );
};
