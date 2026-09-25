/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MoleculeDefinition, ValidationFeedback, ElectronType, PlacedElectron } from '../types/chemistry';

export function validateMolecule(
  molecule: MoleculeDefinition,
  electrons: PlacedElectron[]
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

  // Check orientation: whether metal = dot & non-metal = cross (standard)
  // or metal = cross & non-metal = dot (inverted)
  // We accept both as long as it is internally consistent!
  let standardFitScore = 0;
  let invertedFitScore = 0;

  molecule.atoms.forEach((atom) => {
    const list = atomElectrons[atom.id] || [];
    list.forEach((e) => {
      if (atom.role === 'cation') {
        if (e.type === 'dot') standardFitScore++;
        if (e.type === 'cross') invertedFitScore++;
      } else {
        // Anion expected to have mostly non-metal electrons plus some transferred
        if (e.type === 'cross') standardFitScore++;
        if (e.type === 'dot') invertedFitScore++;
      }
    });
  });

  const orientation: 'standard' | 'inverted' = invertedFitScore > standardFitScore ? 'inverted' : 'standard';
  const metalSym: ElectronType = orientation === 'standard' ? 'dot' : 'cross';
  const nonMetalSym: ElectronType = orientation === 'standard' ? 'cross' : 'dot';

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
          `${atom.element.name} must lose ${initialValence === 1 ? 'its 1 valence electron' : `all ${initialValence} valence electrons`} to form ${atom.element.ionSymbol}.`
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
      // Non-metal anion must reach full octet of 8 electrons (or duet for H, but here octet)
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
        } else if (!correctTransferCount) {
          tips.push(
            `${atom.element.name} should have ${originalValence} ${nonMetalSym === 'cross' ? 'crosses (✖)' : 'dots (●)'} from itself and ${neededTransfers} transferred ${metalSym === 'dot' ? 'dots (●)' : 'crosses (✖)'} from the metal.`
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

  // Determine title and feedback message
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
      message = `${cationCount} ${molecule.cationFormula} ions (+${totalPositiveCharge}) balance with ${anionCount} ${molecule.anionFormula} ions (-${totalNegativeCharge}). Total charge is zero in the simplest whole-number ratio ${cationCount}:${anionCount} (${molecule.formula})!`;
    }
  } else {
    if (!allCationsEmptied) {
      title = 'Valence Electrons Still on Metal';
      message = 'Metals lose all of their outer valence electrons during ionic bonding to form positive ions (cations). Transfer these electrons into the non-metal outer shell!';
    } else if (!allAnionsSatisfied) {
      title = 'Non-Metal Octet Incomplete';
      message = 'Non-metal atoms gain electrons from the metal until their outer shell contains a stable octet of 8 electrons.';
    } else if (unassigned.length > 0) {
      title = 'Stray Electrons on Canvas';
      message = 'Some electrons are placed outside the atom shells. Snap them onto the outer circles or use the eraser.';
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

  const expectedDots = orientation === 'standard' ? molecule.expectedTotalDots : molecule.expectedTotalCrosses;
  const expectedCrosses = orientation === 'standard' ? molecule.expectedTotalCrosses : molecule.expectedTotalDots;

  // Mock bond status array for UI compatibility
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
    activeOrientation: orientation,
    atomSymbols,
    tips,
  };
}
