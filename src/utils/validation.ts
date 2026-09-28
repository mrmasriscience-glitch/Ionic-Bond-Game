/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MoleculeDefinition, ValidationFeedback, ElectronType, PlacedElectron } from '../types/chemistry';

export function validateMolecule(
  molecule: MoleculeDefinition,
  electrons: PlacedElectron[],
  assignedSymbols?: Record<string, ElectronType>
): ValidationFeedback {
  // Group electrons by the closest atom shell
  const atomElectrons: Record<string, PlacedElectron[]> = {};
  molecule.atoms.forEach((a) => {
    atomElectrons[a.id] = [];
  });

  const unassigned: PlacedElectron[] = [];

  electrons.forEach((e) => {
    let closestAtomId: string | null = null;
    let minD = Infinity;

    molecule.atoms.forEach((atom) => {
      const d = Math.hypot(e.x - atom.x, e.y - atom.y);
      if (d <= atom.radius + 38) {
        if (d < minD) {
          minD = d;
          closestAtomId = atom.id;
        }
      }
    });

    if (closestAtomId) {
      atomElectrons[closestAtomId].push(e);
    } else {
      unassigned.push(e);
    }
  });

  // Determine metal and non-metal symbols from assignedSymbols or default to standard
  const cationSample = molecule.atoms.find((a) => a.role === 'cation');
  const anionSample = molecule.atoms.find((a) => a.role === 'anion');

  const metalSym: ElectronType = (cationSample && assignedSymbols?.[cationSample.id]) || 'dot';
  const nonMetalSym: ElectronType = (anionSample && assignedSymbols?.[anionSample.id]) || (metalSym === 'dot' ? 'cross' : 'dot');

  const atomSymbols: Record<string, ElectronType> = {};
  molecule.atoms.forEach((atom) => {
    atomSymbols[atom.id] = atom.role === 'cation' ? metalSym : nonMetalSym;
  });

  // Evaluate each atom's state
  let totalPositiveCharge = 0;
  let totalNegativeCharge = 0;
  let totalTransferredCount = 0;
  let allAnionsSatisfied = true;
  let allCationsEmptied = true;
  const tips: string[] = [];

  const atomStatuses = molecule.atoms.map((atom) => {
    const list = atomElectrons[atom.id] || [];
    const count = list.length;

    if (atom.role === 'cation') {
      // In the final ionic dot-and-cross diagram, metal cation has transferred outer shell electrons
      // So outer valence electrons remaining should be 0!
      const initialValence = atom.element.valenceElectrons;
      const electronsLeft = list.length;
      const isEmptied = electronsLeft === 0;

      if (!isEmptied) {
        allCationsEmptied = false;
        tips.push(
          `${atom.element.name} must lose ${initialValence === 1 ? 'its 1 outer electron' : `all ${initialValence} outer electrons`} to form ${atom.element.ionSymbol}.`
        );
      }

      totalPositiveCharge += atom.element.ionCharge;

      return {
        atomId: atom.id,
        atomName: atom.element.name,
        currentElectrons: count,
        targetElectrons: 0,
        isSatisfied: isEmptied,
        ruleName: 'Emptied Shell' as const,
        charge: atom.element.ionCharge,
        role: 'cation' as const,
      };
    } else {
      // Non-metal anion must reach full octet of 8 electrons
      const targetOctet = 8;
      const originalValence = atom.element.valenceElectrons;
      const neededTransfers = targetOctet - originalValence;

      const nonMetalElectrons = list.filter((e) => e.type === nonMetalSym).length;
      const transferredElectrons = list.filter((e) => e.type === metalSym).length;

      totalTransferredCount += transferredElectrons;

      const hasOctet = count === 8;
      const correctNonMetalCount = nonMetalElectrons === originalValence;
      const correctTransferCount = transferredElectrons === neededTransfers;
      const isSatisfied = hasOctet && correctNonMetalCount && correctTransferCount;

      if (!isSatisfied) {
        allAnionsSatisfied = false;
        if (count < 8) {
          tips.push(
            `${atom.element.name} has ${originalValence} outer electrons and needs ${neededTransfers} more to complete its octet (8 e⁻).`
          );
        } else if (count > 8) {
          tips.push(`${atom.element.name} has too many electrons (${count} e⁻). Anions hold a stable octet of 8 e⁻.`);
        } else if (!correctNonMetalCount || !correctTransferCount) {
          const nonMetalGlyph = nonMetalSym === 'dot' ? 'dots (●)' : 'crosses (✖)';
          const metalGlyph = metalSym === 'dot' ? 'dots (●)' : 'crosses (✖)';
          tips.push(
            `Infer from inner shells: ${atom.element.name} must have ${originalValence} ${nonMetalGlyph} from itself, plus ${neededTransfers} transferred ${metalGlyph} from the metal.`
          );
        }
      }

      totalNegativeCharge += Math.abs(atom.element.ionCharge);

      return {
        atomId: atom.id,
        atomName: atom.element.name,
        currentElectrons: count,
        targetElectrons: targetOctet,
        isSatisfied,
        ruleName: 'Octet' as const,
        charge: atom.element.ionCharge,
        role: 'anion' as const,
      };
    }
  });

  const expectedTransfers = molecule.electronsTransferred;
  const isNeutral = totalPositiveCharge === totalNegativeCharge;
  const transfersMatch = totalTransferredCount === expectedTransfers;
  const isValid = allAnionsSatisfied && allCationsEmptied && isNeutral && unassigned.length === 0;

  // Compute educational score (0 to 100)
  let score = 0;
  if (unassigned.length === 0) score += 10;
  if (allCationsEmptied) score += 30;

  const satisfiedAnionsCount = atomStatuses.filter((s) => s.role === 'anion' && s.isSatisfied).length;
  const totalAnions = molecule.atoms.filter((a) => a.role === 'anion').length;
  if (totalAnions > 0) {
    score += Math.round((satisfiedAnionsCount / totalAnions) * 40);
  }

  if (transfersMatch) score += 15;
  if (isNeutral) score += 5;
  score = Math.min(100, Math.max(0, score));

  let title = 'Ionic Diagram in Progress';
  let message = '';

  if (isValid) {
    title = 'Stable Ionic Compound Formed! ✓';
    const metalName = molecule.atoms.find((a) => a.role === 'cation')?.element.name || 'Metal';
    const nonMetalName = molecule.atoms.find((a) => a.role === 'anion')?.element.name || 'Non-metal';
    const cationCount = molecule.cationRatio;
    const anionCount = molecule.anionRatio;

    if (cationCount === 1 && anionCount === 1) {
      message = `${metalName} transfers ${molecule.electronsTransferred} electron${molecule.electronsTransferred > 1 ? 's' : ''} to ${nonMetalName}, forming ${molecule.cationFormula} and ${molecule.anionFormula}. The opposite charges attract electrostatically in a 1:1 ratio to form neutral ${molecule.formula}!`;
    } else if (cationCount === 1 && anionCount > 1) {
      message = `${metalName} loses ${molecule.electronsTransferred} electrons, forming ${molecule.cationFormula}. ${anionCount} ${nonMetalName} atoms each gain electrons to form ${molecule.anionFormula}. ${anionCount} anions balance the positive charge, yielding neutral ${molecule.formula}!`;
    } else if (cationCount > 1 && anionCount === 1) {
      message = `${cationCount} ${metalName} atoms each lose electrons, forming ${molecule.cationFormula}. ${nonMetalName} gains the transferred electrons to form ${molecule.anionFormula}. Overall charges balance (+${totalPositiveCharge} and -${totalNegativeCharge}) to give ${molecule.formula}!`;
    } else {
      message = `${cationCount} ${molecule.cationFormula} ions (+${totalPositiveCharge}) balance with ${anionCount} ${molecule.anionFormula} ions (-${totalNegativeCharge}). Total charge is zero in the smallest whole-number ratio ${cationCount}:${anionCount} (${molecule.formula})!`;
    }
  } else {
    // Check if any anion has 8 electrons but wrong symbol distribution
    const hasSymbolMismatch = molecule.atoms
      .filter((a) => a.role === 'anion')
      .some((a) => {
        const list = atomElectrons[a.id] || [];
        const nonMetalElectrons = list.filter((e) => e.type === nonMetalSym).length;
        const transferredElectrons = list.filter((e) => e.type === metalSym).length;
        return list.length === 8 && (nonMetalElectrons !== a.element.valenceElectrons || transferredElectrons !== (8 - a.element.valenceElectrons));
      });

    if (hasSymbolMismatch) {
      const metalName = molecule.atoms.find((a) => a.role === 'cation')?.element.name || 'Metal';
      const nonMetalName = molecule.atoms.find((a) => a.role === 'anion')?.element.name || 'Non-metal';
      const nonMetalGlyph = nonMetalSym === 'dot' ? 'dots (●)' : 'crosses (✖)';
      const metalGlyph = metalSym === 'dot' ? 'dots (●)' : 'crosses (✖)';
      const anionSampleAtom = molecule.atoms.find((a) => a.role === 'anion');
      const val = anionSampleAtom ? anionSampleAtom.element.valenceElectrons : 7;
      const trans = 8 - val;

      title = 'Wrong Electron Symbols (Dot / Cross Mismatch)';
      message = `Infer from inner shells: ${nonMetalName} has ${nonMetalGlyph} in its inner shells, so its own ${val} outer electrons must be ${nonMetalGlyph}. The ${trans} electron${trans > 1 ? 's' : ''} transferred from ${metalName} must be ${metalGlyph}.`;
    } else if (!allCationsEmptied) {
      title = 'Valence Electrons Still on Metal';
      message = 'Metals lose all of their outer valence electrons during ionic bonding to form positive ions (cations). Transfer these electrons into the non-metal outer shell!';
    } else if (!allAnionsSatisfied) {
      title = 'Non-Metal Octet Incomplete';
      message = 'Look closely at the inner shells to infer which atom uses dots (●) and which uses crosses (✖). Non-metal atoms must hold 8 electrons (its own symbol + transferred symbol from the metal).';
    } else if (unassigned.length > 0) {
      title = 'Stray Electrons on Canvas';
      message = 'Some electrons are placed outside the atom shells. Snap them onto the outermost circles or use the eraser.';
    } else {
      title = 'Check Charge Balance';
      message = 'Ensure the number of transferred dots and crosses correctly matches the ionic formula and neutral charge.';
    }
  }

  // Count placed dots and crosses
  let placedDots = 0;
  let placedCrosses = 0;
  electrons.forEach((e) => {
    if (e.type === 'dot') placedDots++;
    if (e.type === 'cross') placedCrosses++;
  });

  const expectedDots = metalSym === 'dot' ? molecule.expectedTotalDots : molecule.expectedTotalCrosses;
  const expectedCrosses = metalSym === 'cross' ? molecule.expectedTotalDots : molecule.expectedTotalCrosses;

  const bondStatuses = [
    {
      description: `${molecule.cationFormula} and ${molecule.anionFormula} Electrostatic Attraction`,
      sharedPairs: totalTransferredCount,
      targetPairs: molecule.electronsTransferred,
      isSatisfied: isValid,
    },
  ];

  return {
    isValid,
    score,
    title,
    message,
    atomStatuses,
    bondStatuses,
    totalPositiveCharge,
    totalNegativeCharge,
    isNeutral,
    transferredCount: totalTransferredCount,
    expectedTransferCount: expectedTransfers,
    dotsRemaining: Math.max(0, expectedDots - placedDots),
    crossesRemaining: Math.max(0, expectedCrosses - placedCrosses),
    expectedDots,
    expectedCrosses,
    activeOrientation: metalSym === 'dot' ? 'standard' : 'inverted',
    atomSymbols,
    tips,
  };
}
