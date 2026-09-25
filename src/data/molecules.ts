/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChemicalElement, MoleculeDefinition } from '../types/chemistry';

export const ELEMENTS: Record<string, ChemicalElement> = {
  // Common Cations (Metals)
  Na: {
    symbol: 'Na',
    name: 'Sodium',
    atomicNumber: 11,
    valenceElectrons: 1,
    maxValence: 8,
    type: 'metal',
    ionCharge: 1,
    ionSymbol: 'Na⁺',
    color: '#8B5CF6', // Purple
    textColor: '#FFFFFF',
  },
  K: {
    symbol: 'K',
    name: 'Potassium',
    atomicNumber: 19,
    valenceElectrons: 1,
    maxValence: 8,
    type: 'metal',
    ionCharge: 1,
    ionSymbol: 'K⁺',
    color: '#A855F7', // Violet
    textColor: '#FFFFFF',
  },
  Li: {
    symbol: 'Li',
    name: 'Lithium',
    atomicNumber: 3,
    valenceElectrons: 1,
    maxValence: 2,
    type: 'metal',
    ionCharge: 1,
    ionSymbol: 'Li⁺',
    color: '#6366F1', // Indigo
    textColor: '#FFFFFF',
  },
  Mg: {
    symbol: 'Mg',
    name: 'Magnesium',
    atomicNumber: 12,
    valenceElectrons: 2,
    maxValence: 8,
    type: 'metal',
    ionCharge: 2,
    ionSymbol: 'Mg²⁺',
    color: '#EC4899', // Pink
    textColor: '#FFFFFF',
  },
  Ca: {
    symbol: 'Ca',
    name: 'Calcium',
    atomicNumber: 20,
    valenceElectrons: 2,
    maxValence: 8,
    type: 'metal',
    ionCharge: 2,
    ionSymbol: 'Ca²⁺',
    color: '#F43F5E', // Rose
    textColor: '#FFFFFF',
  },
  Al: {
    symbol: 'Al',
    name: 'Aluminium',
    atomicNumber: 13,
    valenceElectrons: 3,
    maxValence: 8,
    type: 'metal',
    ionCharge: 3,
    ionSymbol: 'Al³⁺',
    color: '#3B82F6', // Blue
    textColor: '#FFFFFF',
  },

  // Common Anions (Non-Metals)
  Cl: {
    symbol: 'Cl',
    name: 'Chlorine',
    atomicNumber: 17,
    valenceElectrons: 7,
    maxValence: 8,
    type: 'non-metal',
    ionCharge: -1,
    ionSymbol: 'Cl⁻',
    color: '#10B981', // Emerald
    textColor: '#FFFFFF',
  },
  F: {
    symbol: 'F',
    name: 'Fluorine',
    atomicNumber: 9,
    valenceElectrons: 7,
    maxValence: 8,
    type: 'non-metal',
    ionCharge: -1,
    ionSymbol: 'F⁻',
    color: '#14B8A6', // Teal
    textColor: '#FFFFFF',
  },
  Br: {
    symbol: 'Br',
    name: 'Bromine',
    atomicNumber: 35,
    valenceElectrons: 7,
    maxValence: 8,
    type: 'non-metal',
    ionCharge: -1,
    ionSymbol: 'Br⁻',
    color: '#B45309', // Amber Brown
    textColor: '#FFFFFF',
  },
  O: {
    symbol: 'O',
    name: 'Oxygen',
    atomicNumber: 8,
    valenceElectrons: 6,
    maxValence: 8,
    type: 'non-metal',
    ionCharge: -2,
    ionSymbol: 'O²⁻',
    color: '#EF4444', // Red
    textColor: '#FFFFFF',
  },
  S: {
    symbol: 'S',
    name: 'Sulfur',
    atomicNumber: 16,
    valenceElectrons: 6,
    maxValence: 8,
    type: 'non-metal',
    ionCharge: -2,
    ionSymbol: 'S²⁻',
    color: '#EAB308', // Yellow
    textColor: '#1E293B',
  },
  N: {
    symbol: 'N',
    name: 'Nitrogen',
    atomicNumber: 7,
    valenceElectrons: 5,
    maxValence: 8,
    type: 'non-metal',
    ionCharge: -3,
    ionSymbol: 'N³⁻',
    color: '#06B6D4', // Cyan
    textColor: '#FFFFFF',
  },
};

// Generates 3D crystal lattice nodes for alternating cations and anions
function generateLattice3D(
  cationSymbol: string,
  cationCharge: string,
  cationColor: string,
  anionSymbol: string,
  anionCharge: string,
  anionColor: string,
  rows = 3,
  cols = 3,
  depth = 2
) {
  const atoms: {
    symbol: string;
    chargeStr: string;
    x: number;
    y: number;
    z: number;
    color: string;
    radius: number;
    isCation: boolean;
  }[] = [];

  const bonds: { fromIndex: number; toIndex: number; order: number }[] = [];
  const spacing = 1.35;
  const offsetX = ((cols - 1) * spacing) / 2;
  const offsetY = ((rows - 1) * spacing) / 2;
  const offsetZ = ((depth - 1) * spacing) / 2;

  let index = 0;
  const indexMap: Record<string, number> = {};

  for (let z = 0; z < depth; z++) {
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const isCation = (x + y + z) % 2 === 0;
        atoms.push({
          symbol: isCation ? cationSymbol : anionSymbol,
          chargeStr: isCation ? cationCharge : anionCharge,
          x: x * spacing - offsetX,
          y: y * spacing - offsetY,
          z: z * spacing - offsetZ,
          color: isCation ? cationColor : anionColor,
          radius: isCation ? 0.42 : 0.54, // Anions are physically larger than cations
          isCation,
        });

        indexMap[`${x},${y},${z}`] = index;

        // Electrostatic attraction lines between neighboring opposite ions
        if (x > 0) {
          bonds.push({ fromIndex: indexMap[`${x - 1},${y},${z}`], toIndex: index, order: 1 });
        }
        if (y > 0) {
          bonds.push({ fromIndex: indexMap[`${x},${y - 1},${z}`], toIndex: index, order: 1 });
        }
        if (z > 0) {
          bonds.push({ fromIndex: indexMap[`${x},${y},${z - 1}`], toIndex: index, order: 1 });
        }

        index++;
      }
    }
  }

  return { latticeType: 'rock-salt' as const, atoms, bonds };
}

export const MOLECULES: MoleculeDefinition[] = [
  // 1. NaCl (Sodium Chloride)
  {
    id: 'nacl',
    name: 'Sodium Chloride',
    formula: 'NaCl',
    level: 'beginner',
    description: 'Sodium loses 1 valence electron to chlorine, forming [Na]⁺ and [Cl]⁻ in a 1:1 ratio.',
    bondTypeSummary: '1:1 Ratio · [Na]⁺ and [Cl]⁻',
    cationRatio: 1,
    anionRatio: 1,
    cationFormula: 'Na⁺',
    anionFormula: 'Cl⁻',
    electronsTransferred: 1,
    atoms: [
      {
        id: 'na1',
        element: ELEMENTS.Na,
        x: 270,
        y: 255,
        radius: 80,
        symbol: 'dot',
        role: 'cation',
        label: 'Sodium (Metal)',
        expectedCharge: 1,
      },
      {
        id: 'cl1',
        element: ELEMENTS.Cl,
        x: 570,
        y: 255,
        radius: 80,
        symbol: 'cross',
        role: 'anion',
        label: 'Chlorine (Non-Metal)',
        expectedCharge: -1,
      },
    ],
    slots: [],
    expectedBonds: [{ atom1Id: 'na1', atom2Id: 'cl1', bondType: 'ionic', electronPairs: 1 }],
    expectedTotalDots: 1,
    expectedTotalCrosses: 7,
    hint: 'Transfer 1 electron (●) from Sodium into Chlorine’s outer shell to give Chlorine 8 electrons (7✖ + 1●).',
    chemicalFacts: {
      stateAtRoomTemp: 'White crystalline solid',
      meltingPoint: '801 °C',
      structure: 'Giant Ionic Face-Centered Cubic (FCC) Lattice',
      funFact: 'Ordinary table salt! High melting point because of strong omnidirectional electrostatic attraction between Na⁺ and Cl⁻ ions.',
      realWorldUse: 'Food seasoning, food preservation, and chemical feedstock for chlorine and sodium hydroxide production.',
    },
    threeD: generateLattice3D('Na', '+', '#8B5CF6', 'Cl', '−', '#10B981', 3, 3, 2),
  },

  // 2. MgO (Magnesium Oxide)
  {
    id: 'mgo',
    name: 'Magnesium Oxide',
    formula: 'MgO',
    level: 'beginner',
    description: 'Magnesium loses 2 valence electrons to oxygen, forming [Mg]²⁺ and [O]²⁻ in a 1:1 ratio.',
    bondTypeSummary: '1:1 Ratio · [Mg]²⁺ and [O]²⁻',
    cationRatio: 1,
    anionRatio: 1,
    cationFormula: 'Mg²⁺',
    anionFormula: 'O²⁻',
    electronsTransferred: 2,
    atoms: [
      {
        id: 'mg1',
        element: ELEMENTS.Mg,
        x: 270,
        y: 255,
        radius: 80,
        symbol: 'dot',
        role: 'cation',
        label: 'Magnesium (Metal)',
        expectedCharge: 2,
      },
      {
        id: 'o1',
        element: ELEMENTS.O,
        x: 570,
        y: 255,
        radius: 80,
        symbol: 'cross',
        role: 'anion',
        label: 'Oxygen (Non-Metal)',
        expectedCharge: -2,
      },
    ],
    slots: [],
    expectedBonds: [{ atom1Id: 'mg1', atom2Id: 'o1', bondType: 'ionic', electronPairs: 2 }],
    expectedTotalDots: 2,
    expectedTotalCrosses: 6,
    hint: 'Magnesium has 2 valence electrons. Oxygen has 6 valence electrons and needs 2 more (6✖ + 2●) to achieve an octet.',
    chemicalFacts: {
      stateAtRoomTemp: 'White crystalline powder',
      meltingPoint: '2,852 °C',
      structure: 'Giant Ionic Rock-Salt Lattice (2+ / 2− charges)',
      funFact: 'Extremely high melting point (2,852 °C) because 2+ and 2− charges exert much stronger electrostatic attractions than 1+ and 1−!',
      realWorldUse: 'Refractory lining inside industrial blast furnaces and gymnast grip chalk.',
    },
    threeD: generateLattice3D('Mg', '2+', '#EC4899', 'O', '2−', '#EF4444', 3, 3, 2),
  },

  // 3. MgCl₂ (Magnesium Chloride)
  {
    id: 'mgcl2',
    name: 'Magnesium Chloride',
    formula: 'MgCl₂',
    level: 'intermediate',
    description: 'One magnesium atom loses 2 electrons. Each of two chlorine atoms gains 1 electron, forming [Cl]⁻ [Mg]²⁺ [Cl]⁻.',
    bondTypeSummary: '1:2 Ratio · [Mg]²⁺ and 2 [Cl]⁻',
    cationRatio: 1,
    anionRatio: 2,
    cationFormula: 'Mg²⁺',
    anionFormula: 'Cl⁻',
    electronsTransferred: 2,
    atoms: [
      {
        id: 'cl1',
        element: ELEMENTS.Cl,
        x: 180,
        y: 255,
        radius: 76,
        symbol: 'cross',
        role: 'anion',
        label: 'Chloride 1',
        expectedCharge: -1,
      },
      {
        id: 'mg1',
        element: ELEMENTS.Mg,
        x: 420,
        y: 255,
        radius: 76,
        symbol: 'dot',
        role: 'cation',
        label: 'Magnesium',
        expectedCharge: 2,
      },
      {
        id: 'cl2',
        element: ELEMENTS.Cl,
        x: 660,
        y: 255,
        radius: 76,
        symbol: 'cross',
        role: 'anion',
        label: 'Chloride 2',
        expectedCharge: -1,
      },
    ],
    slots: [],
    expectedBonds: [
      { atom1Id: 'mg1', atom2Id: 'cl1', bondType: 'ionic', electronPairs: 1 },
      { atom1Id: 'mg1', atom2Id: 'cl2', bondType: 'ionic', electronPairs: 1 },
    ],
    expectedTotalDots: 2,
    expectedTotalCrosses: 14,
    hint: 'Magnesium loses 2 electrons (●). One electron is transferred to the left chlorine and one to the right chlorine, making two Cl⁻ ions.',
    chemicalFacts: {
      stateAtRoomTemp: 'White crystalline solid',
      meltingPoint: '714 °C',
      structure: 'Layered Cadmium Chloride Ionic Lattice',
      funFact: 'Two chloride ions are required to balance the +2 charge on the magnesium ion for electrical neutrality: (+2) + 2(-1) = 0.',
      realWorldUse: 'Road de-icing in winter, dust control, and manufacturing magnesium metal via electrolysis.',
    },
    threeD: generateLattice3D('Mg', '2+', '#EC4899', 'Cl', '−', '#10B981', 3, 3, 2),
  },

  // 4. CaCl₂ (Calcium Chloride)
  {
    id: 'cacl2',
    name: 'Calcium Chloride',
    formula: 'CaCl₂',
    level: 'intermediate',
    description: 'One calcium atom loses 2 electrons to two chlorine atoms, forming [Cl]⁻ [Ca]²⁺ [Cl]⁻.',
    bondTypeSummary: '1:2 Ratio · [Ca]²⁺ and 2 [Cl]⁻',
    cationRatio: 1,
    anionRatio: 2,
    cationFormula: 'Ca²⁺',
    anionFormula: 'Cl⁻',
    electronsTransferred: 2,
    atoms: [
      {
        id: 'cl1',
        element: ELEMENTS.Cl,
        x: 180,
        y: 255,
        radius: 76,
        symbol: 'cross',
        role: 'anion',
        label: 'Chloride 1',
        expectedCharge: -1,
      },
      {
        id: 'ca1',
        element: ELEMENTS.Ca,
        x: 420,
        y: 255,
        radius: 76,
        symbol: 'dot',
        role: 'cation',
        label: 'Calcium',
        expectedCharge: 2,
      },
      {
        id: 'cl2',
        element: ELEMENTS.Cl,
        x: 660,
        y: 255,
        radius: 76,
        symbol: 'cross',
        role: 'anion',
        label: 'Chloride 2',
        expectedCharge: -1,
      },
    ],
    slots: [],
    expectedBonds: [
      { atom1Id: 'ca1', atom2Id: 'cl1', bondType: 'ionic', electronPairs: 1 },
      { atom1Id: 'ca1', atom2Id: 'cl2', bondType: 'ionic', electronPairs: 1 },
    ],
    expectedTotalDots: 2,
    expectedTotalCrosses: 14,
    hint: 'Calcium loses both of its 2 valence electrons. Each chlorine needs exactly 1 electron to complete its octet (7✖ + 1●).',
    chemicalFacts: {
      stateAtRoomTemp: 'White crystalline solid',
      meltingPoint: '772 °C',
      structure: 'Orthorhombic Rutile-Type Ionic Lattice',
      funFact: 'Calcium chloride is extremely hygroscopic: it readily absorbs water vapor from the air until it completely dissolves in its own moisture!',
      realWorldUse: 'Desiccants, drying agents, food firming agent (tofu), and airport runway de-icing.',
    },
    threeD: generateLattice3D('Ca', '2+', '#F43F5E', 'Cl', '−', '#10B981', 3, 3, 2),
  },

  // 5. Na₂O (Sodium Oxide)
  {
    id: 'na2o',
    name: 'Sodium Oxide',
    formula: 'Na₂O',
    level: 'intermediate',
    description: 'Two sodium atoms each lose 1 electron to one oxygen atom, forming [Na]⁺ [O]²⁻ [Na]⁺.',
    bondTypeSummary: '2:1 Ratio · 2 [Na]⁺ and [O]²⁻',
    cationRatio: 2,
    anionRatio: 1,
    cationFormula: 'Na⁺',
    anionFormula: 'O²⁻',
    electronsTransferred: 2,
    atoms: [
      {
        id: 'na1',
        element: ELEMENTS.Na,
        x: 180,
        y: 255,
        radius: 76,
        symbol: 'dot',
        role: 'cation',
        label: 'Sodium 1',
        expectedCharge: 1,
      },
      {
        id: 'o1',
        element: ELEMENTS.O,
        x: 420,
        y: 255,
        radius: 76,
        symbol: 'cross',
        role: 'anion',
        label: 'Oxygen',
        expectedCharge: -2,
      },
      {
        id: 'na2',
        element: ELEMENTS.Na,
        x: 660,
        y: 255,
        radius: 76,
        symbol: 'dot',
        role: 'cation',
        label: 'Sodium 2',
        expectedCharge: 1,
      },
    ],
    slots: [],
    expectedBonds: [
      { atom1Id: 'na1', atom2Id: 'o1', bondType: 'ionic', electronPairs: 1 },
      { atom1Id: 'na2', atom2Id: 'o1', bondType: 'ionic', electronPairs: 1 },
    ],
    expectedTotalDots: 2,
    expectedTotalCrosses: 6,
    hint: 'Each Sodium loses 1 electron (●). Oxygen gains 2 electrons (one from each sodium) to fill its valence shell (6✖ + 2●).',
    chemicalFacts: {
      stateAtRoomTemp: 'White crystalline solid',
      meltingPoint: '1,132 °C',
      structure: 'Antifluorite Ionic Crystal Lattice',
      funFact: 'Reacts violently with water to form sodium hydroxide (NaOH), a strong corrosive alkaline solution!',
      realWorldUse: 'Key component in the manufacture of standard soda-lime glass and ceramics.',
    },
    threeD: generateLattice3D('Na', '+', '#8B5CF6', 'O', '2−', '#EF4444', 3, 3, 2),
  },

  // 6. Al₂O₃ (Aluminium Oxide)
  {
    id: 'al2o3',
    name: 'Aluminium Oxide',
    formula: 'Al₂O₃',
    level: 'advanced',
    description: 'Two aluminium atoms lose 3 electrons each (6 total). Three oxygen atoms gain 2 electrons each (6 total), forming 2 [Al]³⁺ and 3 [O]²⁻.',
    bondTypeSummary: '2:3 Ratio · 2 [Al]³⁺ and 3 [O]²⁻',
    cationRatio: 2,
    anionRatio: 3,
    cationFormula: 'Al³⁺',
    anionFormula: 'O²⁻',
    electronsTransferred: 6,
    atoms: [
      {
        id: 'o1',
        element: ELEMENTS.O,
        x: 120,
        y: 255,
        radius: 64,
        symbol: 'cross',
        role: 'anion',
        label: 'Oxide 1',
        expectedCharge: -2,
      },
      {
        id: 'al1',
        element: ELEMENTS.Al,
        x: 270,
        y: 255,
        radius: 64,
        symbol: 'dot',
        role: 'cation',
        label: 'Aluminium 1',
        expectedCharge: 3,
      },
      {
        id: 'o2',
        element: ELEMENTS.O,
        x: 420,
        y: 255,
        radius: 64,
        symbol: 'cross',
        role: 'anion',
        label: 'Oxide 2',
        expectedCharge: -2,
      },
      {
        id: 'al2',
        element: ELEMENTS.Al,
        x: 570,
        y: 255,
        radius: 64,
        symbol: 'dot',
        role: 'cation',
        label: 'Aluminium 2',
        expectedCharge: 3,
      },
      {
        id: 'o3',
        element: ELEMENTS.O,
        x: 720,
        y: 255,
        radius: 64,
        symbol: 'cross',
        role: 'anion',
        label: 'Oxide 3',
        expectedCharge: -2,
      },
    ],
    slots: [],
    expectedBonds: [
      { atom1Id: 'al1', atom2Id: 'o1', bondType: 'ionic', electronPairs: 2 },
      { atom1Id: 'al1', atom2Id: 'o2', bondType: 'ionic', electronPairs: 1 },
      { atom1Id: 'al2', atom2Id: 'o2', bondType: 'ionic', electronPairs: 1 },
      { atom1Id: 'al2', atom2Id: 'o3', bondType: 'ionic', electronPairs: 2 },
    ],
    expectedTotalDots: 6,
    expectedTotalCrosses: 18,
    hint: '2 × (+3) = +6 from Aluminium. 3 × (−2) = −6 from Oxygen. Total charge balances to zero in a 2:3 ratio!',
    chemicalFacts: {
      stateAtRoomTemp: 'White crystalline powder / corundum gem',
      meltingPoint: '2,072 °C',
      structure: 'Hexagonal Close-Packed Corundum Ionic Lattice',
      funFact: 'Naturally occurs as the mineral corundum: rubies (red with chromium) and sapphires (blue with iron/titanium) are both aluminium oxide crystals!',
      realWorldUse: 'Production of aluminium metal (Hall–Héroult process), sandpaper abrasives, and scratch-resistant smartphone camera lenses.',
    },
    threeD: generateLattice3D('Al', '3+', '#3B82F6', 'O', '2−', '#EF4444', 3, 3, 2),
  },

  // 7. LiF (Lithium Fluoride)
  {
    id: 'lif',
    name: 'Lithium Fluoride',
    formula: 'LiF',
    level: 'beginner',
    description: 'Lithium loses 1 valence electron to fluorine, forming [Li]⁺ and [F]⁻.',
    bondTypeSummary: '1:1 Ratio · [Li]⁺ and [F]⁻',
    cationRatio: 1,
    anionRatio: 1,
    cationFormula: 'Li⁺',
    anionFormula: 'F⁻',
    electronsTransferred: 1,
    atoms: [
      {
        id: 'li1',
        element: ELEMENTS.Li,
        x: 270,
        y: 255,
        radius: 80,
        symbol: 'dot',
        role: 'cation',
        label: 'Lithium',
        expectedCharge: 1,
      },
      {
        id: 'f1',
        element: ELEMENTS.F,
        x: 570,
        y: 255,
        radius: 80,
        symbol: 'cross',
        role: 'anion',
        label: 'Fluorine',
        expectedCharge: -1,
      },
    ],
    slots: [],
    expectedBonds: [{ atom1Id: 'li1', atom2Id: 'f1', bondType: 'ionic', electronPairs: 1 }],
    expectedTotalDots: 1,
    expectedTotalCrosses: 7,
    hint: 'Lithium transfers 1 electron (●) to Fluorine. Both ions achieve noble gas stability (Li⁺ like Helium, F⁻ like Neon).',
    chemicalFacts: {
      stateAtRoomTemp: 'White crystalline solid',
      meltingPoint: '848 °C',
      structure: 'Face-Centered Cubic Rock Salt Lattice',
      funFact: 'Li⁺ has a helium duet configuration (2 inner electrons). It has the highest ultraviolet light transmission of any known substance!',
      realWorldUse: 'Specialized UV optical lenses, molten salt nuclear reactor coolant, and lithium battery electrolyte component.',
    },
    threeD: generateLattice3D('Li', '+', '#6366F1', 'F', '−', '#14B8A6', 3, 3, 2),
  },

  // 8. KBr (Potassium Bromide)
  {
    id: 'kbr',
    name: 'Potassium Bromide',
    formula: 'KBr',
    level: 'beginner',
    description: 'Potassium loses 1 valence electron to bromine, forming [K]⁺ and [Br]⁻.',
    bondTypeSummary: '1:1 Ratio · [K]⁺ and [Br]⁻',
    cationRatio: 1,
    anionRatio: 1,
    cationFormula: 'K⁺',
    anionFormula: 'Br⁻',
    electronsTransferred: 1,
    atoms: [
      {
        id: 'k1',
        element: ELEMENTS.K,
        x: 270,
        y: 255,
        radius: 80,
        symbol: 'dot',
        role: 'cation',
        label: 'Potassium',
        expectedCharge: 1,
      },
      {
        id: 'br1',
        element: ELEMENTS.Br,
        x: 570,
        y: 255,
        radius: 80,
        symbol: 'cross',
        role: 'anion',
        label: 'Bromine',
        expectedCharge: -1,
      },
    ],
    slots: [],
    expectedBonds: [{ atom1Id: 'k1', atom2Id: 'br1', bondType: 'ionic', electronPairs: 1 }],
    expectedTotalDots: 1,
    expectedTotalCrosses: 7,
    hint: 'Potassium loses 1 electron to Bromine, leaving K⁺ and Br⁻ with completed octets.',
    chemicalFacts: {
      stateAtRoomTemp: 'White crystalline solid',
      meltingPoint: '734 °C',
      structure: 'Face-Centered Cubic Rock Salt Lattice',
      funFact: 'Historically used in the 19th and early 20th centuries as a sedative and anticonvulsant medication.',
      realWorldUse: 'Infrared spectroscopy windows, veterinary anti-seizure medication, and photographic emulsion development.',
    },
    threeD: generateLattice3D('K', '+', '#A855F7', 'Br', '−', '#B45309', 3, 3, 2),
  },

  // 9. CaS (Calcium Sulfide)
  {
    id: 'cas',
    name: 'Calcium Sulfide',
    formula: 'CaS',
    level: 'intermediate',
    description: 'Calcium transfers 2 electrons to sulfur, forming [Ca]²⁺ and [S]²⁻.',
    bondTypeSummary: '1:1 Ratio · [Ca]²⁺ and [S]²⁻',
    cationRatio: 1,
    anionRatio: 1,
    cationFormula: 'Ca²⁺',
    anionFormula: 'S²⁻',
    electronsTransferred: 2,
    atoms: [
      {
        id: 'ca1',
        element: ELEMENTS.Ca,
        x: 270,
        y: 255,
        radius: 80,
        symbol: 'dot',
        role: 'cation',
        label: 'Calcium',
        expectedCharge: 2,
      },
      {
        id: 's1',
        element: ELEMENTS.S,
        x: 570,
        y: 255,
        radius: 80,
        symbol: 'cross',
        role: 'anion',
        label: 'Sulfur',
        expectedCharge: -2,
      },
    ],
    slots: [],
    expectedBonds: [{ atom1Id: 'ca1', atom2Id: 's1', bondType: 'ionic', electronPairs: 2 }],
    expectedTotalDots: 2,
    expectedTotalCrosses: 6,
    hint: 'Calcium loses 2 electrons (●). Sulfur has 6 valence electrons and needs 2 more (6✖ + 2●) to achieve 8.',
    chemicalFacts: {
      stateAtRoomTemp: 'White / off-white powder',
      meltingPoint: '2,525 °C',
      structure: 'Giant Ionic Rock-Salt Crystal Lattice',
      funFact: 'Has a phosphorescent glow when doped with trace activators, glowing in the dark after exposure to sunlight!',
      realWorldUse: 'Luminous paints, phosphor screens, and heavy metal precipitation in water treatment.',
    },
    threeD: generateLattice3D('Ca', '2+', '#F43F5E', 'S', '2−', '#EAB308', 3, 3, 2),
  },

  // 10. K₂O (Potassium Oxide)
  {
    id: 'k2o',
    name: 'Potassium Oxide',
    formula: 'K₂O',
    level: 'intermediate',
    description: 'Two potassium atoms each lose 1 electron to one oxygen atom, forming [K]⁺ [O]²⁻ [K]⁺.',
    bondTypeSummary: '2:1 Ratio · 2 [K]⁺ and [O]²⁻',
    cationRatio: 2,
    anionRatio: 1,
    cationFormula: 'K⁺',
    anionFormula: 'O²⁻',
    electronsTransferred: 2,
    atoms: [
      {
        id: 'k1',
        element: ELEMENTS.K,
        x: 180,
        y: 255,
        radius: 76,
        symbol: 'dot',
        role: 'cation',
        label: 'Potassium 1',
        expectedCharge: 1,
      },
      {
        id: 'o1',
        element: ELEMENTS.O,
        x: 420,
        y: 255,
        radius: 76,
        symbol: 'cross',
        role: 'anion',
        label: 'Oxygen',
        expectedCharge: -2,
      },
      {
        id: 'k2',
        element: ELEMENTS.K,
        x: 660,
        y: 255,
        radius: 76,
        symbol: 'dot',
        role: 'cation',
        label: 'Potassium 2',
        expectedCharge: 1,
      },
    ],
    slots: [],
    expectedBonds: [
      { atom1Id: 'k1', atom2Id: 'o1', bondType: 'ionic', electronPairs: 1 },
      { atom1Id: 'k2', atom2Id: 'o1', bondType: 'ionic', electronPairs: 1 },
    ],
    expectedTotalDots: 2,
    expectedTotalCrosses: 6,
    hint: 'Each Potassium transfers 1 electron (●). Oxygen gains both electrons to complete its octet of 8.',
    chemicalFacts: {
      stateAtRoomTemp: 'Pale yellow solid',
      meltingPoint: '740 °C (decomposes)',
      structure: 'Antifluorite Ionic Crystal Lattice',
      funFact: 'Highly caustic base that reacts vigorously with moisture in air to produce KOH (potassium hydroxide).',
      realWorldUse: 'Agricultural fertilizers (potash rating), specialty glass, and ceramic glazes.',
    },
    threeD: generateLattice3D('K', '+', '#A855F7', 'O', '2−', '#EF4444', 3, 3, 2),
  },

  // 11. AlCl₃ (Aluminium Chloride)
  {
    id: 'alcl3',
    name: 'Aluminium Chloride',
    formula: 'AlCl₃',
    level: 'advanced',
    description: 'One aluminium atom loses 3 electrons to three chlorine atoms, forming [Al]³⁺ and 3 [Cl]⁻.',
    bondTypeSummary: '1:3 Ratio · [Al]³⁺ and 3 [Cl]⁻',
    cationRatio: 1,
    anionRatio: 3,
    cationFormula: 'Al³⁺',
    anionFormula: 'Cl⁻',
    electronsTransferred: 3,
    atoms: [
      {
        id: 'cl1',
        element: ELEMENTS.Cl,
        x: 135,
        y: 255,
        radius: 66,
        symbol: 'cross',
        role: 'anion',
        label: 'Chloride 1',
        expectedCharge: -1,
      },
      {
        id: 'al1',
        element: ELEMENTS.Al,
        x: 325,
        y: 255,
        radius: 66,
        symbol: 'dot',
        role: 'cation',
        label: 'Aluminium',
        expectedCharge: 3,
      },
      {
        id: 'cl2',
        element: ELEMENTS.Cl,
        x: 515,
        y: 255,
        radius: 66,
        symbol: 'cross',
        role: 'anion',
        label: 'Chloride 2',
        expectedCharge: -1,
      },
      {
        id: 'cl3',
        element: ELEMENTS.Cl,
        x: 705,
        y: 255,
        radius: 66,
        symbol: 'cross',
        role: 'anion',
        label: 'Chloride 3',
        expectedCharge: -1,
      },
    ],
    slots: [],
    expectedBonds: [
      { atom1Id: 'al1', atom2Id: 'cl1', bondType: 'ionic', electronPairs: 1 },
      { atom1Id: 'al1', atom2Id: 'cl2', bondType: 'ionic', electronPairs: 1 },
      { atom1Id: 'al1', atom2Id: 'cl3', bondType: 'ionic', electronPairs: 1 },
    ],
    expectedTotalDots: 3,
    expectedTotalCrosses: 21,
    hint: 'Aluminium loses 3 electrons (●), giving 1 electron to each of the three chlorine atoms to make three Cl⁻ ions.',
    chemicalFacts: {
      stateAtRoomTemp: 'White / pale yellow crystalline solid',
      meltingPoint: '192.4 °C (under pressure)',
      structure: 'Layered Hexagonal Ionic Lattice (in solid state)',
      funFact: 'In the solid state it is ionic, but when melted or vaporized at low temperatures it forms covalent Al₂Cl₆ dimers!',
      realWorldUse: 'Essential Lewis acid catalyst in Friedel–Crafts organic synthesis and antiperspirant active ingredient.',
    },
    threeD: generateLattice3D('Al', '3+', '#3B82F6', 'Cl', '−', '#10B981', 3, 3, 2),
  },

  // 12. Mg₃N₂ (Magnesium Nitride)
  {
    id: 'mg3n2',
    name: 'Magnesium Nitride',
    formula: 'Mg₃N₂',
    level: 'advanced',
    description: 'Three magnesium atoms lose 2 electrons each (6 total). Two nitrogen atoms gain 3 electrons each (6 total), forming 3 [Mg]²⁺ and 2 [N]³⁻.',
    bondTypeSummary: '3:2 Ratio · 3 [Mg]²⁺ and 2 [N]³⁻',
    cationRatio: 3,
    anionRatio: 2,
    cationFormula: 'Mg²⁺',
    anionFormula: 'N³⁻',
    electronsTransferred: 6,
    atoms: [
      {
        id: 'mg1',
        element: ELEMENTS.Mg,
        x: 120,
        y: 255,
        radius: 64,
        symbol: 'dot',
        role: 'cation',
        label: 'Magnesium 1',
        expectedCharge: 2,
      },
      {
        id: 'n1',
        element: ELEMENTS.N,
        x: 270,
        y: 255,
        radius: 64,
        symbol: 'cross',
        role: 'anion',
        label: 'Nitride 1',
        expectedCharge: -3,
      },
      {
        id: 'mg2',
        element: ELEMENTS.Mg,
        x: 420,
        y: 255,
        radius: 64,
        symbol: 'dot',
        role: 'cation',
        label: 'Magnesium 2',
        expectedCharge: 2,
      },
      {
        id: 'n2',
        element: ELEMENTS.N,
        x: 570,
        y: 255,
        radius: 64,
        symbol: 'cross',
        role: 'anion',
        label: 'Nitride 2',
        expectedCharge: -3,
      },
      {
        id: 'mg3',
        element: ELEMENTS.Mg,
        x: 720,
        y: 255,
        radius: 64,
        symbol: 'dot',
        role: 'cation',
        label: 'Magnesium 3',
        expectedCharge: 2,
      },
    ],
    slots: [],
    expectedBonds: [
      { atom1Id: 'mg1', atom2Id: 'n1', bondType: 'ionic', electronPairs: 2 },
      { atom1Id: 'mg2', atom2Id: 'n1', bondType: 'ionic', electronPairs: 1 },
      { atom1Id: 'mg2', atom2Id: 'n2', bondType: 'ionic', electronPairs: 1 },
      { atom1Id: 'mg3', atom2Id: 'n2', bondType: 'ionic', electronPairs: 2 },
    ],
    expectedTotalDots: 6,
    expectedTotalCrosses: 10,
    hint: '3 × (+2) = +6 from Magnesium. 2 × (−3) = −6 from Nitrogen. Net charge is 0 in the smallest whole-number ratio 3:2!',
    chemicalFacts: {
      stateAtRoomTemp: 'Greenish-yellow powder',
      meltingPoint: '1,500 °C (decomposes)',
      structure: 'Anti-bixbyite Cubic Ionic Lattice',
      funFact: 'When magnesium burns in air, it reacts with both oxygen and nitrogen gas, forming some magnesium nitride alongside MgO!',
      realWorldUse: 'Catalyst in the synthesis of cubic boron nitride and high-temperature ceramic materials.',
    },
    threeD: generateLattice3D('Mg', '2+', '#EC4899', 'N', '3−', '#06B6D4', 3, 3, 2),
  },
];

export function getRandomEndlessMolecule(wave: number, excludeId?: string): MoleculeDefinition {
  let pool = MOLECULES;
  if (wave <= 2) {
    pool = MOLECULES.filter((m) => m.level === 'beginner');
  } else if (wave <= 5) {
    pool = MOLECULES.filter((m) => m.level !== 'advanced');
  }
  if (excludeId && pool.length > 1) {
    const filtered = pool.filter((m) => m.id !== excludeId);
    if (filtered.length > 0) pool = filtered;
  }

  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx] || MOLECULES[0];
}
