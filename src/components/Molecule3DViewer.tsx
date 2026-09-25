/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';
import { MoleculeDefinition } from '../types/chemistry';
import { RotateCw, Compass, Layers, ShieldCheck } from 'lucide-react';

interface Molecule3DViewerProps {
  molecule: MoleculeDefinition;
}

export const Molecule3DViewer: React.FC<Molecule3DViewerProps> = ({ molecule }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rotation, setRotation] = useState<{ x: number; y: number }>({ x: 0.25, y: 0.45 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [modelStyle, setModelStyle] = useState<'ball-and-stick' | 'space-filling'>('ball-and-stick');
  const [autoRotate, setAutoRotate] = useState<boolean>(true);

  // Auto-rotate tick
  useEffect(() => {
    if (!autoRotate || isDragging) return;
    const interval = setInterval(() => {
      setRotation((prev) => ({
        x: prev.x,
        y: prev.y + 0.012,
      }));
    }, 30);
    return () => clearInterval(interval);
  }, [autoRotate, isDragging]);

  // Render 3D scene on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = Math.min(width, height) * 0.24;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Rotation matrices
    const cosX = Math.cos(rotation.x);
    const sinX = Math.sin(rotation.x);
    const cosY = Math.cos(rotation.y);
    const sinY = Math.sin(rotation.y);

    // Transform 3D points
    const transformedAtoms = molecule.threeD.atoms.map((atom) => {
      // Rotate around Y axis
      const x1 = atom.x * cosY + atom.z * sinY;
      const z1 = -atom.x * sinY + atom.z * cosY;

      // Rotate around X axis
      const y2 = atom.y * cosX - z1 * sinX;
      const z2 = atom.y * sinX + z1 * cosX;

      // Project onto 2D canvas with perspective
      const perspective = 4.0;
      const distance = perspective / (perspective + z2);
      const projX = centerX + x1 * scale * distance;
      const projY = centerY - y2 * scale * distance;

      return {
        ...atom,
        projX,
        projY,
        zDepth: z2,
        scaleRatio: distance,
      };
    });

    // Sort items by zDepth (painter's algorithm)
    type RenderItem =
      | { type: 'atom'; index: number; z: number }
      | { type: 'bond'; bondIndex: number; z: number };

    const items: RenderItem[] = [];

    molecule.threeD.atoms.forEach((_, idx) => {
      items.push({ type: 'atom', index: idx, z: transformedAtoms[idx].zDepth });
    });

    molecule.threeD.bonds.forEach((bond, bIdx) => {
      const zAvg = (transformedAtoms[bond.fromIndex].zDepth + transformedAtoms[bond.toIndex].zDepth) / 2;
      items.push({ type: 'bond', bondIndex: bIdx, z: zAvg });
    });

    items.sort((a, b) => b.z - a.z);

    items.forEach((item) => {
      if (item.type === 'bond' && modelStyle === 'ball-and-stick') {
        const bond = molecule.threeD.bonds[item.bondIndex];
        const a1 = transformedAtoms[bond.fromIndex];
        const a2 = transformedAtoms[bond.toIndex];

        ctx.beginPath();
        ctx.moveTo(a1.projX, a1.projY);
        ctx.lineTo(a2.projX, a2.projY);
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 3.5 * ((a1.scaleRatio + a2.scaleRatio) / 2);
        ctx.stroke();
      } else if (item.type === 'atom') {
        const atom = transformedAtoms[item.index];
        const baseRadius = modelStyle === 'space-filling' ? atom.radius * 75 : atom.radius * 36;
        const r = Math.max(8, baseRadius * atom.scaleRatio);

        // Radial shading
        const gradient = ctx.createRadialGradient(
          atom.projX - r * 0.35,
          atom.projY - r * 0.35,
          r * 0.1,
          atom.projX,
          atom.projY,
          r
        );

        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.3, atom.color);
        gradient.addColorStop(1, '#0f172a');

        ctx.beginPath();
        ctx.arc(atom.projX, atom.projY, r, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.strokeStyle = atom.isCation ? '#c084fc' : '#34d399';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Ion symbol text overlay
        if (r > 13) {
          ctx.fillStyle = '#ffffff';
          ctx.font = `bold ${Math.round(r * 0.7)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${atom.symbol}${atom.chargeStr}`, atom.projX, atom.projY);
        }
      }
    });
  }, [molecule, rotation, modelStyle]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setRotation((prev) => ({
      x: prev.x + dy * 0.008,
      y: prev.y + dx * 0.008,
    }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col gap-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Giant Ionic Crystal Lattice (3D Solid State)</span>
          </h2>
          <p className="text-xs text-slate-400">
            {molecule.name} ({molecule.formula}) · Infinite 3D arrangement of alternating positive and negative ions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`p-2 rounded-lg text-xs font-medium border transition-colors ${
              autoRotate
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'text-slate-400 bg-slate-800 border-slate-700 hover:text-white'
            }`}
            title="Toggle Auto-Rotation"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            onClick={() =>
              setModelStyle((s) => (s === 'ball-and-stick' ? 'space-filling' : 'ball-and-stick'))
            }
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors"
          >
            {modelStyle === 'ball-and-stick' ? 'Space-Filling' : 'Ball & Stick'}
          </button>
        </div>
      </div>

      {/* 3D Canvas Box */}
      <div className="relative w-full h-[380px] bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing">
        <canvas
          ref={canvasRef}
          width={760}
          height={380}
          className="w-full h-full"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />

        {/* Legend */}
        <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-lg p-2.5 flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-purple-500 shadow-sm" />
            <span className="text-purple-300 font-bold">{molecule.cationFormula} (Cation)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-emerald-500 shadow-sm" />
            <span className="text-emerald-300 font-bold">{molecule.anionFormula} (Anion)</span>
          </div>
        </div>

        <div className="absolute top-3 right-3 text-[11px] text-slate-400 bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
          Drag to Rotate 360°
        </div>
      </div>

      {/* Chemical Significance Box */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 leading-relaxed">
          <strong className="text-white font-semibold">Why Ionic Compounds Do Not Form Individual Molecules:</strong>{' '}
          Unlike covalent substances which form discrete molecules, ionic compounds exist as continuous, giant 3D crystalline lattices. Each positive ion is surrounded by multiple negative ions and vice versa. Because electrostatic attraction acts in all directions, an enormous amount of thermal energy is needed to break these forces, explaining why ionic compounds like {molecule.name} have high melting points ({molecule.chemicalFacts.meltingPoint || 'high'}) and conduct electricity only when molten or aqueous!
        </div>
      </div>
    </div>
  );
};
