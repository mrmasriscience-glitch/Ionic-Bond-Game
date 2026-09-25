/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MoleculeDefinition, ElectronType, PlacedElectron } from '../types/chemistry';

export type ElectronClassification =
  | { region: 'atom_shell'; atomId: string; role: 'cation' | 'anion' }
  | { region: 'outside' };

/**
 * Classifies an (x, y) coordinate relative to the compound's atoms/ions.
 */
export function classifyElectron(
  molecule: MoleculeDefinition,
  x: number,
  y: number
): ElectronClassification {
  let closestAtomId: string | null = null;
  let minDiff = Infinity;
  let closestRole: 'cation' | 'anion' = 'anion';

  for (const atom of molecule.atoms) {
    const d = Math.hypot(x - atom.x, y - atom.y);
    // Generous snap radius around each atom's valence orbit
    if (d <= atom.radius + 40 && d >= 18) {
      const diff = Math.abs(d - atom.radius);
      if (diff < minDiff) {
        minDiff = diff;
        closestAtomId = atom.id;
        closestRole = atom.role;
      }
    }
  }

  if (closestAtomId) {
    return {
      region: 'atom_shell',
      atomId: closestAtomId,
      role: closestRole,
    };
  }

  return { region: 'outside' };
}

/**
 * Smart snap to make freely placed electrons snap neatly around the atom's outer circle in pairs.
 */
export function snapElectronPosition(
  molecule: MoleculeDefinition,
  x: number,
  y: number,
  existingElectrons: PlacedElectron[] = []
): { x: number; y: number; atomId: string } | null {
  const classification = classifyElectron(molecule, x, y);

  if (classification.region === 'outside') {
    return null;
  }

  const atom = molecule.atoms.find((a) => a.id === classification.atomId);
  if (!atom) return null;

  // Calculate angle from atom center
  const angle = Math.atan2(y - atom.y, x - atom.x);

  // 8 standard quadrant pair positions (IGCSE standard: pairs at 12, 3, 6, 9 o'clock)
  // Each quadrant has 2 paired sub-angles: e.g. at -90° (top) -> -100° and -80°
  const standardAngles = [
    // Top pair (around -PI/2)
    -Math.PI / 2 - 0.22,
    -Math.PI / 2 + 0.22,
    // Right pair (around 0)
    -0.22,
    0.22,
    // Bottom pair (around PI/2)
    Math.PI / 2 - 0.22,
    Math.PI / 2 + 0.22,
    // Left pair (around PI / -PI)
    Math.PI - 0.22,
    -Math.PI + 0.22,
  ];

  // Find nearest unoccupied standard angle if close, otherwise place along orbit perimeter
  const r = atom.radius;

  // Check occupied angles on this atom
  const occupiedAngles = existingElectrons
    .filter((e) => Math.hypot(e.x - atom.x, e.y - atom.y) <= atom.radius + 30)
    .map((e) => Math.atan2(e.y - atom.y, e.x - atom.x));

  let bestAngle = angle;
  let minAngleDiff = Infinity;

  for (const stdAngle of standardAngles) {
    let diff = Math.abs(angle - stdAngle);
    if (diff > Math.PI) diff = 2 * Math.PI - diff;

    if (diff < minAngleDiff) {
      // Check if already occupied
      const isTaken = occupiedAngles.some((occ) => {
        let occDiff = Math.abs(occ - stdAngle);
        if (occDiff > Math.PI) occDiff = 2 * Math.PI - occDiff;
        return occDiff < 0.18;
      });

      if (!isTaken) {
        minAngleDiff = diff;
        bestAngle = stdAngle;
      }
    }
  }

  // If clicked reasonably close to a standard position, snap to it, else smooth snap onto perimeter
  const finalAngle = minAngleDiff < 0.5 ? bestAngle : angle;

  return {
    x: Math.round(atom.x + r * Math.cos(finalAngle)),
    y: Math.round(atom.y + r * Math.sin(finalAngle)),
    atomId: atom.id,
  };
}

/**
 * Generates ideal positions for the completed ionic dot-and-cross diagram:
 * - Metals have transferred their valence electrons (0 dots on outer shell, or neutral state)
 * - Anions have their original non-metal crosses (✖) plus the transferred metal dots (●) completing their octet (8 total)!
 */
export function generateIdealPositions(
  molecule: MoleculeDefinition,
  atomSymbols?: Record<string, ElectronType>
): PlacedElectron[] {
  const result: PlacedElectron[] = [];
  let idCounter = 1;

  // Track total electrons needed across anions
  const anions = molecule.atoms.filter((a) => a.role === 'anion');
  const cations = molecule.atoms.filter((a) => a.role === 'cation');

  // Total transferred electrons needed is sum of anion deficits
  // For each anion: original valence electrons are crosses (✖)
  // Transferred electrons from metals are dots (●)
  const metalSymbol: ElectronType = 'dot';
  const nonMetalSymbol: ElectronType = 'cross';

  anions.forEach((anion) => {
    const val = anion.element.valenceElectrons; // e.g. 7 for Cl, 6 for O, 5 for N
    const neededTransfers = 8 - val; // e.g. 1 for Cl, 2 for O, 3 for N

    // Standard 8 paired positions around the perimeter
    const angles = [
      -Math.PI / 2 - 0.24, // Top 1 (cross)
      -Math.PI / 2 + 0.24, // Top 2 (cross/dot)
      -0.24,               // Right 1 (cross)
      0.24,                // Right 2 (cross/dot)
      Math.PI / 2 - 0.24,  // Bottom 1 (cross)
      Math.PI / 2 + 0.24,  // Bottom 2 (cross/dot)
      Math.PI - 0.24,      // Left 1 (cross)
      -Math.PI + 0.24,     // Left 2 (cross/dot)
    ];

    // Distribute: first `val` slots are non-metal electrons (crosses)
    // Remaining `neededTransfers` slots are transferred metal electrons (dots)
    for (let i = 0; i < 8; i++) {
      const isTransferred = i >= val;
      const type: ElectronType = isTransferred ? metalSymbol : nonMetalSymbol;
      const angle = angles[i];
      result.push({
        id: `ideal-${anion.id}-${idCounter++}`,
        x: Math.round(anion.x + anion.radius * Math.cos(angle)),
        y: Math.round(anion.y + anion.radius * Math.sin(angle)),
        type,
        parentAtomId: anion.id,
      });
    }
  });

  return result;
}

/**
 * Generates neutral starting positions (before transfer) for tutorial / starting view:
 * Metal has its initial valence electrons (dots ●).
 * Non-metal has its initial valence electrons (crosses ✖).
 */
export function generateNeutralStartingPositions(molecule: MoleculeDefinition): PlacedElectron[] {
  const result: PlacedElectron[] = [];
  let idCounter = 1;

  molecule.atoms.forEach((atom) => {
    const val = atom.element.valenceElectrons;
    const type: ElectronType = atom.role === 'cation' ? 'dot' : 'cross';

    // Position valence electrons evenly around orbit
    for (let i = 0; i < val; i++) {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / val;
      result.push({
        id: `start-${atom.id}-${idCounter++}`,
        x: Math.round(atom.x + atom.radius * Math.cos(angle)),
        y: Math.round(atom.y + atom.radius * Math.sin(angle)),
        type,
        parentAtomId: atom.id,
      });
    }
  });

  return result;
}
