/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BookOpen, Check, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

export const StepByStepGuide: React.FC<{ onStartBuilding: () => void }> = ({ onStartBuilding }) => {
  const [activeStep, setActiveStep] = useState<number>(1);

  const steps = [
    {
      step: 1,
      title: 'Identify the Metal and Non-Metal Atoms',
      description: 'Ionic bonding occurs between metals (which lose electrons) and non-metals (which gain electrons). Check their positions on the Periodic Table.',
      details: [
        'Metals (Groups 1, 2, 3: Na, K, Mg, Ca, Al) → have few valence electrons and low ionization energies. They easily lose electrons to form positive cations.',
        'Non-Metals (Groups 5, 6, 7: N, O, S, Cl, Br, F) → have nearly full outer shells and high electron affinities. They gain electrons to form negative anions.',
        'Dot and Cross Rule: Use dots (●) for one element and crosses (✖) for the other element. Always check the inner shells or diagram prompt to infer which symbol represents which atom.',
      ],
      proTip: 'In exams and this lab, either element can use dots or crosses! Inspect the atom’s inner shells to see which symbol it uses, and make sure transferred electrons match the donor metal’s symbol.',
    },
    {
      step: 2,
      title: 'Determine Valence Electrons & Ion Charges',
      description: 'Atoms lose or gain electrons to achieve the stable electronic configuration of the nearest noble gas (octet of 8 outer electrons).',
      details: [
        'Group 1 metals (Na, K, Li) → 1 valence electron → lose 1 e⁻ → form 1+ ions (Na⁺, K⁺, Li⁺).',
        'Group 2 metals (Mg, Ca) → 2 valence electrons → lose 2 e⁻ → form 2+ ions (Mg²⁺, Ca²⁺).',
        'Group 3 metals (Al) → 3 valence electrons → lose 3 e⁻ → form 3+ ions (Al³⁺).',
        'Group 7 halogens (Cl, Br, F) → 7 valence electrons → gain 1 e⁻ → form 1− ions (Cl⁻, Br⁻, F⁻).',
        'Group 6 non-metals (O, S) → 6 valence electrons → gain 2 e⁻ → form 2− ions (O²⁻, S²⁻).',
        'Group 5 non-metals (N) → 5 valence electrons → gain 3 e⁻ → form 3− ions (N³⁻).',
      ],
      proTip: 'The charge number equals the number of electrons transferred: losing electrons gives positive (+), gaining electrons gives negative (−).',
    },
    {
      step: 3,
      title: 'Transfer Electrons from Metal to Non-Metal',
      description: 'Unlike covalent bonding where electrons are shared, ionic bonding is a complete physical transfer of electrons from metal to non-metal.',
      details: [
        'Metals lose all of their outer valence electrons. Their original outer shell becomes empty (revealing the full stable inner shell).',
        'Non-metals accept the transferred electrons until their outer shell reaches a complete octet of 8 electrons.',
        'Example: In NaCl, Sodium loses 1 dot (●). Chlorine has 7 crosses (✖) and accepts the 1 dot (●), achieving a full octet of 8 electrons (7✖ + 1●).',
      ],
      proTip: 'Never draw overlapping circles in ionic bonding! Each atom or ion is drawn separately.',
    },
    {
      step: 4,
      title: 'Enclose Ions in Square Brackets with Charges',
      description: 'Because the atoms have gained or lost electrons, they are no longer neutral: they must be enclosed in square brackets with their charges.',
      details: [
        'Draw square brackets [ ... ] around every individual ion in the diagram.',
        'Write the net charge as a superscript outside the top-right corner of the bracket.',
        'Cations: write [Na]⁺, [Mg]²⁺, [Al]³⁺ with an empty outer valence shell.',
        'Anions: write [Cl]⁻, [O]²⁻, [N]³⁻ showing 8 electrons (original crosses + transferred dots).',
        'Notice the standard convention: numeral comes before the sign for multiple charges: 2+, 3+, 2−, 3−.',
      ],
      proTip: 'Examiners award marks specifically for: (1) square brackets around ions, (2) correct charges outside brackets, and (3) 8 electrons on the non-metal with correct dot/cross origin.',
    },
    {
      step: 5,
      title: 'Balance Charges to Find the Ratio & Formula',
      description: 'The overall ionic compound must be electrically neutral: total positive charge must equal total negative charge.',
      details: [
        '1:1 Ratio: Na⁺ (+1) + Cl⁻ (−1) = 0 → Formula is NaCl (no numeral 1 in formulas).',
        '1:1 Ratio with 2e⁻: Mg²⁺ (+2) + O²⁻ (−2) = 0 → Formula is MgO.',
        '1:2 Ratio: Mg²⁺ (+2) needs two Cl⁻ (−1 each) → (+2) + 2(−1) = 0 → Formula is MgCl₂.',
        '2:1 Ratio: Two Na⁺ (+1 each) are needed for one O²⁻ (−2) → 2(+1) + (−2) = 0 → Formula is Na₂O.',
        '2:3 Ratio: Two Al³⁺ (2 × +3 = +6) balance three O²⁻ (3 × −2 = −6) → Formula is Al₂O₃.',
      ],
      proTip: 'Use the "cross-over rule" to check: the charge number of the cation becomes the subscript of the anion, and vice-versa, simplified to the smallest whole-number ratio!',
    },
  ];

  const current = steps[activeStep - 1];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">How to Draw Ionic Dot and Cross Diagrams</h2>
            <p className="text-xs text-slate-400">
              A 5-step visual guide for IGCSE, GCSE, AP Chemistry, and High School Science
            </p>
          </div>
        </div>

        <button
          onClick={onStartBuilding}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors shadow-sm"
        >
          <span>Practice in Lab</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Step Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {steps.map((s) => (
          <button
            key={s.step}
            onClick={() => setActiveStep(s.step)}
            className={`p-2.5 rounded-lg border text-left transition-all ${
              activeStep === s.step
                ? 'bg-cyan-950/60 border-cyan-500/80 text-white shadow-md'
                : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400">
                Step 0{s.step}
              </span>
              {activeStep > s.step && <Check className="w-3.5 h-3.5 text-emerald-400" />}
            </div>
            <div className="text-xs font-semibold truncate text-slate-200">
              {s.title.split(' ')[0]} {s.title.split(' ')[1]}
            </div>
          </button>
        ))}
      </div>

      {/* Step Detail Content Card */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
        <div>
          <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest block mb-1">
            Step {current.step} of 5
          </span>
          <h3 className="text-base font-bold text-white">{current.title}</h3>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">{current.description}</p>
        </div>

        {/* Detailed Points */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-lg p-3.5">
          <span className="text-[11px] font-semibold text-slate-400 block mb-2 uppercase tracking-wider">
            Key Rules & Observations:
          </span>
          <ul className="space-y-2 text-xs text-slate-200">
            {current.details.map((point, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                <span className="leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pro Tip Box */}
        <div className="bg-amber-950/20 border border-amber-500/30 rounded-lg p-3 flex items-start gap-2.5">
          <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-200 leading-relaxed">
            <strong className="font-semibold text-amber-300">Examiner Pro-Tip:</strong> {current.proTip}
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => setActiveStep((prev) => Math.max(1, prev - 1))}
          disabled={activeStep === 1}
          className="px-4 py-2 text-xs font-medium rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
        >
          Previous Step
        </button>

        <span className="text-xs text-slate-500 font-mono">
          {activeStep} / 5
        </span>

        {activeStep < 5 ? (
          <button
            onClick={() => setActiveStep((prev) => Math.min(5, prev + 1))}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
          >
            <span>Next Step</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            onClick={onStartBuilding}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-colors shadow-md"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Ready! Start Building</span>
          </button>
        )}
      </div>
    </div>
  );
};
