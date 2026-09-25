/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ELEMENTS } from '../data/molecules';
import { Table, Zap } from 'lucide-react';

interface ElementInfo {
  symbol: string;
  name: string;
  group: number;
  period: number;
  atomicNumber: number;
  type: 'metal' | 'non-metal';
  valenceElectrons: number;
  electronAction: 'loses' | 'gains';
  electronsChanged: number;
  ionSymbol: string;
  ionCharge: string;
  initialElectronConfig: string;
  ionElectronConfig: string;
  description: string;
  examples: string[];
}

const COMMON_IONIC_ELEMENTS: ElementInfo[] = [
  // Group 1 Metals
  {
    symbol: 'Na',
    name: 'Sodium',
    group: 1,
    period: 3,
    atomicNumber: 11,
    type: 'metal',
    valenceElectrons: 1,
    electronAction: 'loses',
    electronsChanged: 1,
    ionSymbol: 'Na⁺',
    ionCharge: '+1',
    initialElectronConfig: '2, 8, 1',
    ionElectronConfig: '2, 8 (Neon configuration)',
    description: 'Alkali metal in Group 1. Readily loses its 1 outer valence electron to form a stable Na⁺ cation with a full outer octet.',
    examples: ['NaCl', 'Na₂O', 'NaF'],
  },
  {
    symbol: 'K',
    name: 'Potassium',
    group: 1,
    period: 4,
    atomicNumber: 19,
    type: 'metal',
    valenceElectrons: 1,
    electronAction: 'loses',
    electronsChanged: 1,
    ionSymbol: 'K⁺',
    ionCharge: '+1',
    initialElectronConfig: '2, 8, 8, 1',
    ionElectronConfig: '2, 8, 8 (Argon configuration)',
    description: 'Highly reactive Group 1 metal. Easily loses its single 4s valence electron to become K⁺.',
    examples: ['KBr', 'K₂O', 'KCl'],
  },
  {
    symbol: 'Li',
    name: 'Lithium',
    group: 1,
    period: 2,
    atomicNumber: 3,
    type: 'metal',
    valenceElectrons: 1,
    electronAction: 'loses',
    electronsChanged: 1,
    ionSymbol: 'Li⁺',
    ionCharge: '+1',
    initialElectronConfig: '2, 1',
    ionElectronConfig: '2 (Helium duet configuration)',
    description: 'Lightest metal. Loses 1 valence electron to form Li⁺ with a stable Helium duet configuration.',
    examples: ['LiF', 'Li₂O', 'LiCl'],
  },

  // Group 2 Metals
  {
    symbol: 'Mg',
    name: 'Magnesium',
    group: 2,
    period: 3,
    atomicNumber: 12,
    type: 'metal',
    valenceElectrons: 2,
    electronAction: 'loses',
    electronsChanged: 2,
    ionSymbol: 'Mg²⁺',
    ionCharge: '+2',
    initialElectronConfig: '2, 8, 2',
    ionElectronConfig: '2, 8 (Neon configuration)',
    description: 'Alkaline earth metal in Group 2. Loses both of its 2 valence electrons to form a dipositive Mg²⁺ cation.',
    examples: ['MgO', 'MgCl₂', 'Mg₃N₂'],
  },
  {
    symbol: 'Ca',
    name: 'Calcium',
    group: 2,
    period: 4,
    atomicNumber: 20,
    type: 'metal',
    valenceElectrons: 2,
    electronAction: 'loses',
    electronsChanged: 2,
    ionSymbol: 'Ca²⁺',
    ionCharge: '+2',
    initialElectronConfig: '2, 8, 8, 2',
    ionElectronConfig: '2, 8, 8 (Argon configuration)',
    description: 'Group 2 metal. Loses 2 valence electrons to form Ca²⁺ with an Argon noble-gas core.',
    examples: ['CaCl₂', 'CaS', 'CaO'],
  },

  // Group 3 Metal
  {
    symbol: 'Al',
    name: 'Aluminium',
    group: 13,
    period: 3,
    atomicNumber: 13,
    type: 'metal',
    valenceElectrons: 3,
    electronAction: 'loses',
    electronsChanged: 3,
    ionSymbol: 'Al³⁺',
    ionCharge: '+3',
    initialElectronConfig: '2, 8, 3',
    ionElectronConfig: '2, 8 (Neon configuration)',
    description: 'Group 3 (13) post-transition metal. Loses all 3 valence electrons to form a tripositive Al³⁺ cation.',
    examples: ['Al₂O₃', 'AlCl₃', 'AlF₃'],
  },

  // Group 7 Non-Metals (Halogens)
  {
    symbol: 'Cl',
    name: 'Chlorine',
    group: 17,
    period: 3,
    atomicNumber: 17,
    type: 'non-metal',
    valenceElectrons: 7,
    electronAction: 'gains',
    electronsChanged: 1,
    ionSymbol: 'Cl⁻',
    ionCharge: '−1',
    initialElectronConfig: '2, 8, 7',
    ionElectronConfig: '2, 8, 8 (Argon configuration)',
    description: 'Halogen with 7 valence electrons. Readily gains 1 electron from a metal to form a chloride ion (Cl⁻) with an octet of 8.',
    examples: ['NaCl', 'MgCl₂', 'CaCl₂', 'AlCl₃'],
  },
  {
    symbol: 'F',
    name: 'Fluorine',
    group: 17,
    period: 2,
    atomicNumber: 9,
    type: 'non-metal',
    valenceElectrons: 7,
    electronAction: 'gains',
    electronsChanged: 1,
    ionSymbol: 'F⁻',
    ionCharge: '−1',
    initialElectronConfig: '2, 7',
    ionElectronConfig: '2, 8 (Neon configuration)',
    description: 'The most electronegative element. Strongly attracts 1 electron to complete its octet as fluoride (F⁻).',
    examples: ['LiF', 'NaF', 'AlF₃'],
  },
  {
    symbol: 'Br',
    name: 'Bromine',
    group: 17,
    period: 4,
    atomicNumber: 35,
    type: 'non-metal',
    valenceElectrons: 7,
    electronAction: 'gains',
    electronsChanged: 1,
    ionSymbol: 'Br⁻',
    ionCharge: '−1',
    initialElectronConfig: '2, 8, 18, 7',
    ionElectronConfig: '2, 8, 18, 8 (Krypton configuration)',
    description: 'Liquid halogen with 7 valence electrons. Gains 1 electron from a metal to form bromide (Br⁻).',
    examples: ['KBr', 'NaBr', 'MgBr₂'],
  },

  // Group 6 Non-Metals
  {
    symbol: 'O',
    name: 'Oxygen',
    group: 16,
    period: 2,
    atomicNumber: 8,
    type: 'non-metal',
    valenceElectrons: 6,
    electronAction: 'gains',
    electronsChanged: 2,
    ionSymbol: 'O²⁻',
    ionCharge: '−2',
    initialElectronConfig: '2, 6',
    ionElectronConfig: '2, 8 (Neon configuration)',
    description: 'Group 6 non-metal with 6 valence electrons. Gains 2 electrons to form an oxide ion (O²⁻) with a stable octet of 8.',
    examples: ['MgO', 'Na₂O', 'Al₂O₃', 'K₂O'],
  },
  {
    symbol: 'S',
    name: 'Sulfur',
    group: 16,
    period: 3,
    atomicNumber: 16,
    type: 'non-metal',
    valenceElectrons: 6,
    electronAction: 'gains',
    electronsChanged: 2,
    ionSymbol: 'S²⁻',
    ionCharge: '−2',
    initialElectronConfig: '2, 8, 6',
    ionElectronConfig: '2, 8, 8 (Argon configuration)',
    description: 'Group 16 element below oxygen. Gains 2 electrons to form a sulfide ion (S²⁻) with an octet of 8.',
    examples: ['CaS', 'Na₂S', 'MgS'],
  },

  // Group 5 Non-Metal
  {
    symbol: 'N',
    name: 'Nitrogen',
    group: 15,
    period: 2,
    atomicNumber: 7,
    type: 'non-metal',
    valenceElectrons: 5,
    electronAction: 'gains',
    electronsChanged: 3,
    ionSymbol: 'N³⁻',
    ionCharge: '−3',
    initialElectronConfig: '2, 5',
    ionElectronConfig: '2, 8 (Neon configuration)',
    description: 'Group 5 non-metal with 5 valence electrons. Gains 3 electrons from electropositive metals to form nitride (N³⁻).',
    examples: ['Mg₃N₂', 'Li₃N', 'AlN'],
  },
];

export const PeriodicTableReference: React.FC = () => {
  const [selectedSymbol, setSelectedSymbol] = useState<string>('Na');
  const selected = COMMON_IONIC_ELEMENTS.find((e) => e.symbol === selectedSymbol) || COMMON_IONIC_ELEMENTS[0];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Table className="w-4 h-4 text-cyan-400" />
            <span>Periodic Table: Monatomic Ions & Electron Configurations</span>
          </h2>
          <p className="text-xs text-slate-400">
            Click any element to inspect its valence electrons, electron transfer direction, and resulting ion charge
          </p>
        </div>
      </div>

      {/* Grid of Elements */}
      <div className="flex flex-col gap-3">
        <div>
          <span className="text-[11px] font-mono font-bold text-purple-400 uppercase tracking-wider block mb-1.5">
            Metals → Lose Electrons to Form Cations (+)
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
            {COMMON_IONIC_ELEMENTS.filter((e) => e.type === 'metal').map((elem) => {
              const isSelected = elem.symbol === selectedSymbol;
              return (
                <button
                  key={elem.symbol}
                  onClick={() => setSelectedSymbol(elem.symbol)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-28 relative ${
                    isSelected
                      ? 'bg-purple-950/70 border-purple-400 ring-2 ring-purple-400/30 shadow-lg'
                      : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-mono text-slate-400 font-semibold">{elem.atomicNumber}</span>
                    <span className="text-[10px] font-mono text-purple-300 font-bold">{elem.ionSymbol}</span>
                  </div>

                  <div className="text-center">
                    <span className="text-2xl font-black text-white font-sans block">{elem.symbol}</span>
                    <span className="text-[11px] text-slate-300 font-medium truncate block">{elem.name}</span>
                  </div>

                  <div className="flex items-center justify-between w-full pt-1 border-t border-slate-800/80 text-[10px] font-mono">
                    <span className="text-purple-400 font-semibold">Lose {elem.electronsChanged}e⁻</span>
                    <span className="text-slate-400">{elem.ionCharge}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-wider block mb-1.5">
            Non-Metals → Gain Electrons to Form Anions (−)
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
            {COMMON_IONIC_ELEMENTS.filter((e) => e.type === 'non-metal').map((elem) => {
              const isSelected = elem.symbol === selectedSymbol;
              return (
                <button
                  key={elem.symbol}
                  onClick={() => setSelectedSymbol(elem.symbol)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-28 relative ${
                    isSelected
                      ? 'bg-emerald-950/70 border-emerald-400 ring-2 ring-emerald-400/30 shadow-lg'
                      : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-mono text-slate-400 font-semibold">{elem.atomicNumber}</span>
                    <span className="text-[10px] font-mono text-emerald-300 font-bold">{elem.ionSymbol}</span>
                  </div>

                  <div className="text-center">
                    <span className="text-2xl font-black text-white font-sans block">{elem.symbol}</span>
                    <span className="text-[11px] text-slate-300 font-medium truncate block">{elem.name}</span>
                  </div>

                  <div className="flex items-center justify-between w-full pt-1 border-t border-slate-800/80 text-[10px] font-mono">
                    <span className="text-emerald-400 font-semibold">Gain {elem.electronsChanged}e⁻</span>
                    <span className="text-slate-400">{elem.ionCharge}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Detailed Element Inspector Panel */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row gap-6 items-start">
        {/* Left: Atomic & Ion Badge */}
        <div className="w-full md:w-52 bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col items-center justify-center text-center shrink-0">
          <div className="text-xs font-mono text-slate-400 mb-1">Atomic No. {selected.atomicNumber}</div>
          <div className="text-4xl font-extrabold text-cyan-400 font-sans my-1">{selected.symbol}</div>
          <div className="text-sm font-bold text-white">{selected.name}</div>
          <div className="mt-2 text-sm font-mono font-black text-purple-300 bg-slate-950 px-3 py-1 rounded border border-slate-800">
            Ion: {selected.ionSymbol} ({selected.ionCharge})
          </div>
        </div>

        {/* Right: Chemical Properties */}
        <div className="flex-1 flex flex-col gap-3">
          <div>
            <h3 className="text-sm font-bold text-white mb-1">
              Ion Formation & Electronic Configurations
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {selected.description}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-800/80">
            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase font-mono">Valence Electrons</span>
              <span className="text-base font-bold text-cyan-300 font-mono">{selected.valenceElectrons}</span>
            </div>
            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase font-mono">Transfer Action</span>
              <span className="text-base font-bold text-emerald-400 font-mono">
                {selected.electronAction === 'loses' ? `−${selected.electronsChanged}e⁻ (lost)` : `+${selected.electronsChanged}e⁻ (gained)`}
              </span>
            </div>
            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase font-mono">Neutral Config</span>
              <span className="text-sm font-bold text-slate-200 font-mono">{selected.initialElectronConfig}</span>
            </div>
            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase font-mono">Ion Config</span>
              <span className="text-sm font-bold text-cyan-300 font-mono">{selected.ionElectronConfig.split(' ')[0]}</span>
            </div>
          </div>

          <div className="pt-2 text-xs flex items-center gap-2 flex-wrap">
            <span className="text-slate-400 font-medium">Common Compounds:</span>
            {selected.examples.map((ex) => (
              <span
                key={ex}
                className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded text-[11px] font-mono border border-slate-700/60"
              >
                {ex}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Fundamental Law of Ionic Bonding */}
      <div className="bg-cyan-950/20 border border-cyan-500/30 rounded-lg p-3.5 flex items-start gap-3">
        <Zap className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 leading-relaxed">
          <strong className="text-cyan-300 font-semibold">The Fundamental Rule of Ionic Bonding:</strong> Ionic bonds are strong electrostatic forces of attraction between oppositely charged ions formed by the transfer of electrons from metal atoms to non-metal atoms. The total positive charge must exactly equal the total negative charge so that the resulting ionic compound is neutral overall.
        </div>
      </div>
    </div>
  );
};
