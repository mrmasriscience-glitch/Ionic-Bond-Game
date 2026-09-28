/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ElectronType = 'dot' | 'cross';

export interface PlacedElectron {
  id: string;
  x: number;
  y: number;
  type: ElectronType;
  parentAtomId?: string;
}

export interface ChemicalElement {
  symbol: string;
  name: string;
  atomicNumber: number;
  period?: number; // Principal quantum shell number (2, 3, 4)
  innerShells?: number[]; // e.g. [2, 8] for Na/Cl, [2] for O/F/Li, [2, 8, 8] for Ca/K
  valenceElectrons: number;
  maxValence: number; // 8 for octet
  type: 'metal' | 'non-metal';
  ionCharge: number; // e.g. +1, +2, +3, -1, -2, -3
  ionSymbol: string; // e.g. "Na⁺", "Mg²⁺", "Cl⁻", "O²⁻"
  color: string;
  textColor: string;
}

export interface MoleculeAtom {
  id: string;
  element: ChemicalElement;
  x: number;
  y: number;
  radius: number; // Radius of outermost interactive shell
  innerShellRadii?: number[]; // Radii of faint, non-interactive inner shells
  symbol: ElectronType; // Whether this atom donates dots or crosses
  role: 'cation' | 'anion';
  label?: string; // e.g. "Sodium Atom", "Chlorine Atom"
  bracketX?: number;
  bracketWidth?: number;
  bracketHeight?: number;
  expectedCharge?: number; // e.g. +1, +2, -1, -2
}

export interface ElectronSlot {
  id: string;
  x: number;
  y: number;
  region: 'cation_shell' | 'anion_shell';
  atomId: string;
  acceptedType?: ElectronType;
  label?: string;
  isTransferred?: boolean;
}

export interface BondTarget {
  atom1Id: string;
  atom2Id: string;
  bondType: 'single' | 'double' | 'triple' | 'ionic';
  electronPairs: number;
}

export type GameMode = 'curriculum' | 'endless';
export type EndlessType = 'blitz' | 'streak';
export type DifficultyMode = 'guided' | 'hard';

export interface EndlessState {
  isActive: boolean;
  type: EndlessType;
  score: number;
  highScore: number;
  streak: number;
  bestStreak: number;
  multiplier: number;
  timeLeft: number;
  lives: number;
  wave: number;
  moleculesSolved: number;
  hintsUsedInRound: number;
  roundStartTime: number;
  isGameOver: boolean;
}

export interface IonicTransfer {
  fromAtomId: string;
  toAtomId: string;
  electronCount: number;
}

export interface MoleculeDefinition {
  id: string;
  name: string;
  formula: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  description: string;
  bondTypeSummary: string; // e.g. "1:1 Ion Ratio · Na⁺ and Cl⁻" or "1:2 Ion Ratio · Mg²⁺ and 2 Cl⁻"
  cationRatio: number;
  anionRatio: number;
  cationFormula: string;
  anionFormula: string;
  electronsTransferred: number; // total electrons transferred in unit
  atoms: MoleculeAtom[];
  slots: ElectronSlot[];
  expectedBonds: BondTarget[];
  expectedTotalDots: number;
  expectedTotalCrosses: number;
  hint: string;
  chemicalFacts: {
    stateAtRoomTemp: string;
    meltingPoint?: string;
    structure: string; // e.g. "Giant Ionic Crystal Lattice"
    funFact: string;
    realWorldUse: string;
  };
  // 3D representation for Giant Ionic Crystal Lattice preview
  threeD: {
    latticeType: 'rock-salt' | 'fluorite' | 'rutile' | 'cesium-chloride';
    atoms: {
      symbol: string;
      chargeStr: string;
      x: number;
      y: number;
      z: number;
      color: string;
      radius: number;
      isCation: boolean;
    }[];
    bonds: {
      fromIndex: number;
      toIndex: number;
      order: number;
    }[];
  };
}

export interface ValidationFeedback {
  isValid: boolean;
  score: number; // 0 to 100
  title: string;
  message: string;
  atomStatuses: {
    atomId: string;
    atomName: string;
    currentElectrons: number;
    targetElectrons: number;
    isSatisfied: boolean;
    ruleName: 'Octet' | 'Emptied Shell' | 'Duet';
    charge: number;
    role: 'cation' | 'anion';
  }[];
  bondStatuses: {
    description: string;
    sharedPairs: number;
    targetPairs: number;
    isSatisfied: boolean;
  }[];
  totalPositiveCharge: number;
  totalNegativeCharge: number;
  isNeutral: boolean;
  transferredCount: number;
  expectedTransferCount: number;
  dotsRemaining: number;
  crossesRemaining: number;
  expectedDots: number;
  expectedCrosses: number;
  activeOrientation: 'standard' | 'inverted';
  atomSymbols: Record<string, ElectronType>;
  tips: string[];
}
