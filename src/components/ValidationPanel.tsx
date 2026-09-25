/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Zap,
  Info,
  X,
  ShieldCheck,
  Flame,
} from 'lucide-react';
import { MoleculeDefinition, ValidationFeedback } from '../types/chemistry';

interface ValidationPanelProps {
  molecule: MoleculeDefinition;
  feedback: ValidationFeedback;
  onNextMolecule?: () => void;
  hasNextMolecule: boolean;
  onReset: () => void;
  isHardMode?: boolean;
  isEndless?: boolean;
  isSurvivalHardMode?: boolean;
  endlessType?: 'blitz' | 'streak';
  onSubmitAnswer?: () => void;
}

export const ValidationPanel: React.FC<ValidationPanelProps> = ({
  molecule,
  feedback,
  onNextMolecule,
  hasNextMolecule,
  onReset,
  isHardMode = false,
  isEndless = false,
  isSurvivalHardMode = false,
  endlessType,
  onSubmitAnswer,
}) => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [hasTriggeredConfetti, setHasTriggeredConfetti] = useState<boolean>(false);

  const handleCheckBonds = () => {
    if (feedback.isValid) {
      if (!hasTriggeredConfetti) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#a855f7', '#10b981', '#06b6d4', '#f59e0b'],
        });
        setHasTriggeredConfetti(true);
      }
    }
    setShowModal(true);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-xl flex flex-col gap-2.5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            {isHardMode ? 'Ion Shell & Charge Status' : 'Ionic Structure & Neutrality'}
          </h2>
        </div>
        <div className="text-[11px] text-slate-400 font-mono">
          {isHardMode ? (
            <span className="text-rose-400 font-semibold">Strict Exam</span>
          ) : (
            <>
              Score: <span className="text-cyan-300 font-bold tabular-nums">{feedback.score}%</span>
            </>
          )}
        </div>
      </div>

      {/* Ion Shell & Charge Statuses */}
      <div className="flex flex-col gap-1.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {feedback.atomStatuses.map((atom) => {
            const isCation = atom.role === 'cation';
            const pct = isCation
              ? atom.currentElectrons === 0
                ? 100
                : 0
              : Math.min(100, Math.round((atom.currentElectrons / atom.targetElectrons) * 100));

            return (
              <div
                key={atom.atomId}
                className={`p-2 rounded-lg border text-xs transition-colors ${
                  !isHardMode && atom.isSatisfied
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                    : 'bg-slate-800/50 border-slate-700/60 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1 font-medium truncate">
                    <span className="text-xs">{atom.atomName}</span>
                    <span
                      className={`text-[10px] font-mono font-bold px-1 rounded ${
                        isCation ? 'bg-purple-950/80 text-purple-300' : 'bg-emerald-950/80 text-emerald-300'
                      }`}
                    >
                      {isCation ? `+${atom.charge}` : `${atom.charge}`}
                    </span>
                  </div>
                  <span
                    className={`text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded ${
                      !isHardMode && atom.isSatisfied
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-slate-700/60 text-slate-400'
                    }`}
                  >
                    {isHardMode
                      ? atom.isSatisfied && feedback.isValid
                        ? 'Valid ✓'
                        : 'Target'
                      : isCation
                      ? atom.isSatisfied
                        ? 'Emptied Shell ✓'
                        : 'Loses e⁻'
                      : atom.isSatisfied
                      ? 'Octet (8 e⁻) ✓'
                      : 'Needs e⁻'}
                  </span>
                </div>

                {!isHardMode ? (
                  <>
                    <div className="w-full bg-slate-900 rounded-full h-1 overflow-hidden border border-slate-700/40 mb-1">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${
                          atom.isSatisfied
                            ? 'bg-emerald-400'
                            : isCation
                            ? 'bg-purple-400'
                            : 'bg-cyan-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>
                        {isCation
                          ? atom.currentElectrons === 0
                            ? '0 e⁻ (outer shell lost)'
                            : `${atom.currentElectrons} e⁻ still on metal`
                          : `${atom.currentElectrons} / 8 e⁻ in shell`}
                      </span>
                      <span>{atom.isSatisfied ? 'Stable ion' : 'Pending transfer'}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>Target: Stable ion</span>
                    <span className="text-slate-500">Unrevealed</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Stoichiometric Ratio & Electrical Neutrality Display */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg px-2.5 py-1.5 flex items-center justify-between text-xs">
        <div>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold leading-tight">
            Compound Formula
          </span>
          <span className="text-base font-bold font-mono text-cyan-300 tracking-wide leading-tight">
            {isHardMode && !feedback.isValid ? (
              <span className="text-slate-500 text-xs font-normal">[Hidden until valid]</span>
            ) : (
              molecule.formula
            )}
          </span>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 block leading-tight">Charge Balance</span>
          <span
            className={`text-[11px] font-mono font-bold leading-tight ${
              feedback.isNeutral ? 'text-emerald-300' : 'text-amber-300'
            }`}
          >
            {isHardMode && !feedback.isValid
              ? 'Deduce Ratio'
              : `(+${feedback.totalPositiveCharge}) + (−${feedback.totalNegativeCharge}) = 0 Net`}
          </span>
        </div>
      </div>

      {/* Teacher Tips List */}
      {!feedback.isValid && !isHardMode && feedback.tips.length > 0 && (
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-2 text-xs flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-amber-300 font-semibold text-[11px]">
            <Info className="w-3 h-3 shrink-0" />
            <span>Chemistry Guidance</span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            {feedback.tips[0]}
          </p>
        </div>
      )}

      {/* Mode status indicator banner */}
      {isSurvivalHardMode ? (
        <div className="text-[10.5px] text-rose-300 bg-rose-950/40 border border-rose-500/30 rounded-lg px-2.5 py-1.5 flex items-center justify-between">
          <span className="font-bold flex items-center gap-1">
            <Flame className="w-3 h-3 text-rose-400" /> Survival Exam Mode:
          </span>
          <span className="text-slate-300">No auto-submit. Press Submit below!</span>
        </div>
      ) : isEndless && endlessType === 'blitz' ? (
        <div className="text-[10.5px] text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 rounded-lg px-2.5 py-1.5 flex items-center justify-between">
          <span className="font-bold flex items-center gap-1">
            <Zap className="w-3 h-3 text-cyan-400" /> Timed Mode:
          </span>
          <span className="text-slate-300">Auto-submits instantly when correct!</span>
        </div>
      ) : null}

      {/* Action Buttons: Next Question, Submit Structure & Check Status */}
      <div className="flex items-center gap-2">
        {isEndless ? (
          <>
            <button
              onClick={onSubmitAnswer}
              className={`flex-1 py-2.5 px-3 rounded-lg font-bold text-xs tracking-wide flex items-center justify-center gap-1.5 transition-all shadow-md select-none cursor-pointer active:scale-98 ${
                isSurvivalHardMode
                  ? 'bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 shadow-rose-500/25'
                  : 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-amber-500/25'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSurvivalHardMode ? 'Submit Ionic Diagram' : 'Submit Diagram'}</span>
            </button>
            <button
              onClick={handleCheckBonds}
              className="py-2.5 px-3 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700/60 transition-colors whitespace-nowrap cursor-pointer"
              title="View chemical facts"
            >
              Info
            </button>
          </>
        ) : feedback.isValid ? (
          <>
            {hasNextMolecule ? (
              <button
                onClick={onNextMolecule}
                className="flex-1 py-2 px-3 rounded-lg font-bold text-xs tracking-wide flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 transition-all shadow-lg shadow-emerald-500/20 select-none cursor-pointer animate-pulse"
              >
                <span>Next Compound</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex-1 py-2 px-3 rounded-lg font-bold text-xs text-center bg-emerald-950/60 text-emerald-300 border border-emerald-500/40">
                All Curriculum Solved! 🎉
              </div>
            )}
            <button
              onClick={handleCheckBonds}
              className="py-2 px-3 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700/60 transition-colors whitespace-nowrap"
              title="View full chemical insights report"
            >
              Report
            </button>
          </>
        ) : (
          <button
            onClick={handleCheckBonds}
            className={`w-full py-2 px-3 rounded-lg font-semibold text-xs tracking-wide flex items-center justify-center gap-2 transition-all shadow-md select-none cursor-pointer ${
              isHardMode
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/20'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isHardMode ? 'Verify Ionic Transfer' : `Check Diagram (${feedback.score}%)`}</span>
          </button>
        )}
      </div>

      {/* Feedback & Chemistry Learning Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-5 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  feedback.isValid
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                }`}
              >
                {feedback.isValid ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white leading-tight">
                  {feedback.title}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {molecule.name} ({molecule.formula}) · Ionic Bonding Dot-and-Cross Analysis
                </p>
              </div>
            </div>

            {/* Explanation Prose */}
            <p className="text-xs leading-relaxed text-slate-300">
              {feedback.message}
            </p>

            {/* Chemical Properties & Facts Box */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 flex flex-col gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-cyan-400 font-semibold text-[11px] uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Chemical Insights & Crystal Structure</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                <div>
                  <span className="text-slate-500 block">Structure:</span>
                  <span className="font-medium text-slate-200">{molecule.chemicalFacts.structure}</span>
                </div>
                {molecule.chemicalFacts.meltingPoint && (
                  <div>
                    <span className="text-slate-500 block">Melting Point:</span>
                    <span className="font-medium text-slate-200">{molecule.chemicalFacts.meltingPoint}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-500 block">State at 25°C:</span>
                  <span className="font-medium text-slate-200">{molecule.chemicalFacts.stateAtRoomTemp}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Ion Ratio:</span>
                  <span className="font-medium text-cyan-300">
                    {molecule.cationRatio} {molecule.cationFormula} : {molecule.anionRatio} {molecule.anionFormula}
                  </span>
                </div>
              </div>

              <div className="text-[11px] pt-1 border-t border-slate-800 text-slate-300">
                <strong className="text-slate-200">The Ionic Bond:</strong>{' '}
                Metals have low ionization energy and lose valence electrons to form positive cations with empty outer shells. Non-metals have high electron affinity and gain these electrons to complete their octet (8 e⁻) inside square brackets with negative charges. Strong electrostatic attraction between these oppositely charged ions binds them into a rigid 3D lattice!
              </div>

              <div className="text-[11px] text-slate-400 bg-slate-900/80 p-2 rounded border border-slate-800/80">
                <strong className="text-amber-400">Did you know?</strong> {molecule.chemicalFacts.funFact}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              >
                Keep Exploring
              </button>

              {feedback.isValid && hasNextMolecule && (
                <button
                  onClick={() => {
                    setShowModal(false);
                    onNextMolecule?.();
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors shadow-md"
                >
                  <span>Next Compound</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
