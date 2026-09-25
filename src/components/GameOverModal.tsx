/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Trophy, Flame, RotateCcw, Award } from 'lucide-react';
import { EndlessState } from '../types/chemistry';

interface GameOverModalProps {
  state: EndlessState;
  onPlayAgain: () => void;
  onExitToCurriculum: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  state,
  onPlayAgain,
  onExitToCurriculum,
}) => {
  const isNewHighScore = state.score > 0 && state.score >= state.highScore;

  // Compute rank title based on compounds solved
  let rank = 'Ion Apprentice';
  let rankDesc = 'Keep practicing to master electron transfer and bracketed dot-and-cross diagrams!';
  if (state.moleculesSolved >= 15) {
    rank = 'Ionic Grandmaster';
    rankDesc = 'Phenomenal mastery! You construct complex multi-ion compounds with flawless charge balance.';
  } else if (state.moleculesSolved >= 10) {
    rank = 'Lattice Architect';
    rankDesc = 'Exceptional intuition for octet completion and crystal lattice ratios!';
  } else if (state.moleculesSolved >= 6) {
    rank = 'Crystal Chemist';
    rankDesc = 'Strong understanding of 1:1, 1:2, and 2:3 ionic compounds.';
  } else if (state.moleculesSolved >= 3) {
    rank = 'Cation & Anion Scholar';
    rankDesc = 'Good progress on electron transfer and stoichiometric neutrality.';
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-5 text-center animate-in fade-in zoom-in-95 duration-200">
        {/* Trophy icon */}
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center mx-auto shadow-inner">
          <Trophy className="w-8 h-8" />
        </div>

        <div>
          {isNewHighScore && (
            <div className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400 mb-1 animate-pulse">
              ★ New All-Time High Score! ★
            </div>
          )}
          <h2 className="text-2xl font-black text-white tracking-tight">Run Finished</h2>
          <p className="text-xs text-slate-400 mt-1">
            {state.type === 'blitz' ? 'Time expired in Blitz Rush' : 'All 3 lives spent in Streak Challenge'}
          </p>
        </div>

        {/* Score & Rank Card */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs text-slate-400 font-medium">Final Score</span>
            <span className="text-2xl font-black font-mono text-cyan-400 tabular-nums">
              {state.score}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800 text-left">
              <span className="text-[10px] text-slate-500 block">Compounds Solved</span>
              <span className="font-mono font-bold text-white text-base">{state.moleculesSolved}</span>
            </div>
            <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800 text-left">
              <span className="text-[10px] text-slate-500 block">Best Streak</span>
              <span className="font-mono font-bold text-amber-400 text-base flex items-center gap-1">
                <Flame className="w-4 h-4" />
                {state.bestStreak}
              </span>
            </div>
          </div>

          {/* Achieved Rank */}
          <div className="bg-cyan-950/30 border border-cyan-500/30 rounded-lg p-2.5 text-left">
            <div className="flex items-center gap-1.5 text-cyan-300 text-xs font-bold mb-0.5">
              <Award className="w-3.5 h-3.5" />
              <span>Rank: {rank}</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">{rankDesc}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-1">
          <button
            onClick={onPlayAgain}
            className="w-full py-3 px-4 rounded-xl font-bold text-xs tracking-wider uppercase text-slate-950 bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play Again</span>
          </button>

          <button
            onClick={onExitToCurriculum}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 transition-colors"
          >
            Return to Curriculum
          </button>
        </div>
      </div>
    </div>
  );
};
