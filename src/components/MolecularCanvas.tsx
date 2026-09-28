/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize2, ArrowRight } from 'lucide-react';
import { MoleculeDefinition, ElectronType, PlacedElectron } from '../types/chemistry';
import { snapElectronPosition, classifyElectron, generateIdealPositions } from '../utils/geometry';
import { soundEffects } from '../utils/audio';

function getIonName(symbol: string, name: string, isCation: boolean): string {
  if (isCation) {
    return `${name} Cation`;
  }
  const anionNameMap: Record<string, string> = {
    Cl: 'Chloride',
    F: 'Fluoride',
    Br: 'Bromide',
    I: 'Iodide',
    O: 'Oxide',
    S: 'Sulfide',
    N: 'Nitride',
    NO3: 'Nitrate',
    SO4: 'Sulfate',
    PO4: 'Phosphate',
    CO3: 'Carbonate',
    OH: 'Hydroxide',
    'NO₃': 'Nitrate',
    'SO₄': 'Sulfate',
    'PO₄': 'Phosphate',
    'CO₃': 'Carbonate',
  };
  const base = anionNameMap[symbol] || name;
  return `${base} Anion`;
}

interface MolecularCanvasProps {
  molecule: MoleculeDefinition;
  placedElectrons: PlacedElectron[];
  activeTool: 'dot' | 'cross' | 'eraser';
  onPlaceElectron: (electron: PlacedElectron) => void;
  onRemoveElectron: (id: string) => void;
  onUpdateElectron: (id: string, x: number, y: number, isDropFinal?: boolean) => void;
  showHints: boolean;
  isCompleted: boolean;
  isHardMode?: boolean;
  atomSymbols?: Record<string, ElectronType>;
}

export const MolecularCanvas: React.FC<MolecularCanvasProps> = ({
  molecule,
  placedElectrons,
  activeTool,
  onPlaceElectron,
  onRemoveElectron,
  onUpdateElectron,
  showHints,
  isCompleted,
  isHardMode = false,
  atomSymbols,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverCoord, setHoverCoord] = useState<{ x: number; y: number } | null>(null);
  const [draggingElectronId, setDraggingElectronId] = useState<string | null>(null);
  const dragStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const hasDraggedRef = useRef<boolean>(false);

  // Zoom & Pan interactive state
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const hasMovedRef = useRef<boolean>(false);
  const panStartRef = useRef<{ clientX: number; clientY: number; startPanX: number; startPanY: number }>({
    clientX: 0,
    clientY: 0,
    startPanX: 0,
    startPanY: 0,
  });

  // Track ionized atoms to play audio chime when an atom successfully turns into an ion
  const prevIonizedAtomIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const currentIonized = new Set<string>();
    const newlyIonized: string[] = [];

    molecule.atoms.forEach((atom) => {
      const isCation = atom.role === 'cation';
      const atomElectrons = placedElectrons.filter(
        (e) => Math.hypot(e.x - atom.x, e.y - atom.y) <= atom.radius + 38
      );
      const isIon = isCation ? atomElectrons.length === 0 : atomElectrons.length >= 8;
      if (isIon) {
        currentIonized.add(atom.id);
        if (!prevIonizedAtomIdsRef.current.has(atom.id)) {
          newlyIonized.push(atom.id);
        }
      }
    });

    if (newlyIonized.length > 0 && prevIonizedAtomIdsRef.current.size > 0) {
      const sampleAtom = molecule.atoms.find((a) => a.id === newlyIonized[0]);
      if (sampleAtom) {
        soundEffects.playIonFormed(sampleAtom.role === 'cation');
      }
    }

    prevIonizedAtomIdsRef.current = currentIonized;
  }, [molecule.id, molecule.atoms, placedElectrons]);

  // Calculate default bounding box of all atom orbits and brackets with generous padding
  const defaultBounds = useMemo(() => {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    molecule.atoms.forEach((atom) => {
      minX = Math.min(minX, atom.x - atom.radius - 40);
      maxX = Math.max(maxX, atom.x + atom.radius + 50);
      minY = Math.min(minY, atom.y - atom.radius - 35);
      maxY = Math.max(maxY, atom.y + atom.radius + 35);
    });

    const padding = 35;
    minX -= padding;
    maxX += padding;
    minY -= padding;
    maxY += padding;

    let width = maxX - minX;
    let height = maxY - minY;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const targetAspect = 840 / 510;
    const currentAspect = width / height;

    if (currentAspect > targetAspect) {
      height = width / targetAspect;
    } else {
      width = height * targetAspect;
    }

    width = Math.max(width, 840);
    height = Math.max(height, 510);

    return {
      minX: Math.round(centerX - width / 2),
      minY: Math.round(centerY - height / 2),
      width: Math.round(width),
      height: Math.round(height),
      centerX: Math.round(centerX),
      centerY: Math.round(centerY),
    };
  }, [molecule]);

  // Reset zoom & pan when compound changes
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [molecule.id]);

  const handleZoomIn = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoom((prev) => Math.min(2.5, Number((prev * 1.25).toFixed(2))));
  };

  const handleZoomOut = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoom((prev) => Math.max(0.5, Number((prev / 1.25).toFixed(2))));
  };

  const handleResetZoom = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const currentViewBox = useMemo(() => {
    const w = defaultBounds.width / zoom;
    const h = defaultBounds.height / zoom;
    const cx = defaultBounds.centerX + pan.x;
    const cy = defaultBounds.centerY + pan.y;
    return `${Math.round(cx - w / 2)} ${Math.round(cy - h / 2)} ${Math.round(w)} ${Math.round(h)}`;
  }, [defaultBounds, zoom, pan]);

  const getSvgCoordinates = (clientX: number, clientY: number): { x: number; y: number } | null => {
    if (!svgRef.current) return null;
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const svgP = pt.matrixTransform(ctm.inverse());
    return { x: Math.round(svgP.x), y: Math.round(svgP.y) };
  };

  const findElectronAt = (x: number, y: number, threshold = 18): PlacedElectron | undefined => {
    return placedElectrons.find((e) => Math.hypot(e.x - x, e.y - y) <= threshold);
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    hasMovedRef.current = false;
    panStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startPanX: pan.x,
      startPanY: pan.y,
    };

    if (e.button === 1 || e.altKey || e.shiftKey || zoom > 1) {
      setIsPanning(true);
    }
  };

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.15 : 0.85;
      setZoom((prev) => Math.min(2.5, Math.max(0.5, Number((prev * factor).toFixed(2)))));
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (hasMovedRef.current || hasDraggedRef.current) {
      hasMovedRef.current = false;
      hasDraggedRef.current = false;
      return;
    }

    const coords = getSvgCoordinates(e.clientX, e.clientY);
    if (!coords) return;

    // Check if clicking existing electron
    const existing = findElectronAt(coords.x, coords.y);
    if (existing) {
      if (activeTool === 'eraser') {
        onRemoveElectron(existing.id);
      } else if (isHardMode) {
        if (existing.type === activeTool) {
          onRemoveElectron(existing.id);
        } else {
          const swapId =
            typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
              ? `elec-${crypto.randomUUID()}`
              : `elec-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          onRemoveElectron(existing.id);
          onPlaceElectron({ ...existing, id: swapId, type: activeTool });
        }
      }
      return;
    }

    // In Guided mode, student drags electrons from the metal rather than clicking blank canvas.
    // Placing new electrons directly from clicks is active in Exam mode!
    if (!isHardMode) return;
    if (activeTool === 'eraser') return;

    // Snap to outer orbit of nearest atom
    const snapped = snapElectronPosition(molecule, coords.x, coords.y, placedElectrons);
    if (snapped) {
      const newId =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? `elec-${crypto.randomUUID()}`
          : `elec-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      onPlaceElectron({
        id: newId,
        x: snapped.x,
        y: snapped.y,
        type: activeTool,
        parentAtomId: snapped.atomId,
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    const coords = getSvgCoordinates(e.clientX, e.clientY);
    if (coords) setHoverCoord(coords);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const coords = getSvgCoordinates(e.clientX, e.clientY);
    if (!coords) return;

    if (draggingElectronId) {
      const otherElectrons = placedElectrons.filter((pe) => pe.id !== draggingElectronId);
      const snapped = snapElectronPosition(molecule, coords.x, coords.y, otherElectrons);
      if (snapped) {
        onUpdateElectron(draggingElectronId, snapped.x, snapped.y, true);
      } else if (!isHardMode && dragStartPosRef.current) {
        onUpdateElectron(draggingElectronId, dragStartPosRef.current.x, dragStartPosRef.current.y, false);
      }
      setDraggingElectronId(null);
      dragStartPosRef.current = null;
      return;
    }

    const type = e.dataTransfer.getData('text/plain') as ElectronType;
    if (type === 'dot' || type === 'cross') {
      const snapped = snapElectronPosition(molecule, coords.x, coords.y, placedElectrons);
      if (snapped) {
        const newId =
          typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? `elec-${crypto.randomUUID()}`
            : `elec-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        onPlaceElectron({
          id: newId,
          x: snapped.x,
          y: snapped.y,
          type,
          parentAtomId: snapped.atomId,
        });
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isPanning) {
      const dist = Math.hypot(e.clientX - panStartRef.current.clientX, e.clientY - panStartRef.current.clientY);
      if (dist > 4) {
        hasMovedRef.current = true;
        const svgRect = svgRef.current?.getBoundingClientRect();
        if (svgRect) {
          const scaleX = defaultBounds.width / zoom / svgRect.width;
          const scaleY = defaultBounds.height / zoom / svgRect.height;
          const dx = (e.clientX - panStartRef.current.clientX) * scaleX;
          const dy = (e.clientY - panStartRef.current.clientY) * scaleY;
          setPan({
            x: panStartRef.current.startPanX - dx,
            y: panStartRef.current.startPanY - dy,
          });
        }
      }
      return;
    }

    const coords = getSvgCoordinates(e.clientX, e.clientY);
    if (!coords) return;

    if (draggingElectronId) {
      if (dragStartPosRef.current) {
        const d = Math.hypot(coords.x - dragStartPosRef.current.x, coords.y - dragStartPosRef.current.y);
        if (d > 4) {
          hasDraggedRef.current = true;
        }
      }
      // Follow cursor in real time across the canvas (actively dragging, not dropped yet)
      onUpdateElectron(draggingElectronId, coords.x, coords.y, false);
      return;
    }

    if (isHardMode) {
      const classification = classifyElectron(molecule, coords.x, coords.y);
      if (classification.region !== 'outside') {
        const snapped = snapElectronPosition(molecule, coords.x, coords.y, placedElectrons);
        setHoverCoord(snapped ?? coords);
      } else {
        setHoverCoord(null);
      }
    } else {
      setHoverCoord(null);
    }
  };

  const handleMouseUp = (e: React.MouseEvent<SVGSVGElement>) => {
    setIsPanning(false);

    if (draggingElectronId) {
      if (hasDraggedRef.current) {
        const coords = getSvgCoordinates(e.clientX, e.clientY);
        if (coords) {
          const otherElectrons = placedElectrons.filter((pe) => pe.id !== draggingElectronId);
          const snapped = snapElectronPosition(molecule, coords.x, coords.y, otherElectrons);
          if (snapped) {
            onUpdateElectron(draggingElectronId, snapped.x, snapped.y, true);
          } else if (!isHardMode && dragStartPosRef.current) {
            // In Guided mode, if released out in empty space, return to origin
            onUpdateElectron(draggingElectronId, dragStartPosRef.current.x, dragStartPosRef.current.y, false);
          }
        }
      }
      setDraggingElectronId(null);
      dragStartPosRef.current = null;
      setTimeout(() => {
        hasDraggedRef.current = false;
      }, 60);
    }
  };

  const handleMouseLeave = () => {
    setHoverCoord(null);
    if (draggingElectronId) {
      if (!isHardMode && dragStartPosRef.current) {
        onUpdateElectron(draggingElectronId, dragStartPosRef.current.x, dragStartPosRef.current.y, false);
      }
      setDraggingElectronId(null);
      dragStartPosRef.current = null;
      hasDraggedRef.current = false;
    }
    setIsPanning(false);
  };

  const idealGhostHints = !isHardMode && showHints ? generateIdealPositions(molecule, atomSymbols) : [];

  const standardOctetAngles = useMemo(
    () => [
      -Math.PI / 2 - 0.24,
      -Math.PI / 2 + 0.24,
      -0.24,
      0.24,
      Math.PI / 2 - 0.24,
      Math.PI / 2 + 0.24,
      Math.PI - 0.24,
      -Math.PI + 0.24,
    ],
    []
  );

  // Compute live ionization states for every atom in the molecule
  // Ensures atoms start as neutral atoms without brackets or charges,
  // and dynamically turn into ions with brackets, official charges, and ion names as electrons are dragged
  const atomStates = useMemo(() => {
    const map: Record<
      string,
      {
        isCation: boolean;
        initialValence: number;
        currentCount: number;
        isFullyIonized: boolean;
        isPartiallyIonized: boolean;
        isNeutral: boolean;
        electronsLost: number;
        electronsGained: number;
        officialChargeText: string;
        ionName: string;
        bracketColor: string;
      }
    > = {};

    molecule.atoms.forEach((atom) => {
      const isCation = atom.role === 'cation';
      const initialValence = atom.element.valenceElectrons;

      // Check if the currently dragged electron originated from this atom
      const isDragSource = Boolean(
        draggingElectronId &&
          dragStartPosRef.current &&
          Math.hypot(dragStartPosRef.current.x - atom.x, dragStartPosRef.current.y - atom.y) <= atom.radius + 32
      );

      // Filter placed electrons currently residing on this atom's shell
      const atomElectrons = placedElectrons.filter((e) => {
        if (e.id === draggingElectronId) {
          // While dragging: if it originated on this atom, it has left this atom!
          if (isDragSource) return false;
          // If it's an anion, it only joins this atom if snapped/near vacancy
          const dist = Math.hypot(e.x - atom.x, e.y - atom.y);
          return Math.abs(dist - atom.radius) <= 24;
        }
        return Math.hypot(e.x - atom.x, e.y - atom.y) <= atom.radius + 34;
      });

      const currentCount = atomElectrons.length;

      // Fully formed ion states:
      // Cation: outer valence shell completely emptied (0 electrons on outer shell)
      // Anion: complete octet of 8 electrons on outer shell
      const isFullyIonized = isCation ? currentCount === 0 : currentCount >= 8;
      const isPartiallyIonized = isCation
        ? currentCount > 0 && currentCount < initialValence
        : currentCount > initialValence && currentCount < 8;
      const isNeutral = isCation ? currentCount >= initialValence : currentCount <= initialValence;

      const electronsLost = Math.max(0, initialValence - currentCount);
      const electronsGained = Math.max(0, currentCount - initialValence);

      const officialChargeText = isCation
        ? atom.element.ionCharge === 1
          ? '⁺'
          : `${atom.element.ionCharge}⁺`
        : Math.abs(atom.element.ionCharge) === 1
        ? '⁻'
        : `${Math.abs(atom.element.ionCharge)}⁻`;

      const ionName = getIonName(atom.element.symbol, atom.element.name, isCation);
      const bracketColor = isCation ? '#a855f7' : '#10b981';

      map[atom.id] = {
        isCation,
        initialValence,
        currentCount,
        isFullyIonized,
        isPartiallyIonized,
        isNeutral,
        electronsLost,
        electronsGained,
        officialChargeText,
        ionName,
        bracketColor,
      };
    });

    return map;
  }, [molecule.atoms, placedElectrons, draggingElectronId]);

  // Overall compound transformation summary (Reactant Atoms vs In Progress vs Ionic Compound)
  const overallStatus = useMemo(() => {
    const states = Object.values(atomStates);
    const allNeutral = states.length > 0 && states.every((s) => s.isNeutral);
    const allIonized = states.length > 0 && states.every((s) => s.isFullyIonized);
    if (allNeutral) {
      const reactants = molecule.atoms.map((a) => `${a.element.symbol}⁰`).join(' + ');
      return {
        type: 'neutral',
        badgeText: `Reactant Atoms (${reactants})`,
        instruction: 'Guided Mode: Drag metal valence electrons across to non-metal vacancies',
      };
    }
    if (allIonized) {
      return {
        type: 'ionized',
        badgeText: `Ionic Compound · ${molecule.bondTypeSummary}`,
        instruction: '✓ All atoms converted to ions! Ionic bond successfully formed.',
      };
    }
    return {
      type: 'transferring',
      badgeText: 'Ionization in Progress: Atoms → Ions',
      instruction: 'Drag electrons across to complete non-metal octets',
    };
  }, [atomStates, molecule.atoms, molecule.bondTypeSummary]);

  return (
    <div className="relative w-full aspect-[840/510] min-h-[360px] max-h-[440px] lg:max-h-[470px] bg-slate-950/90 border border-slate-800 rounded-xl shadow-xl overflow-hidden select-none">
      {/* Background Starfield & Grid Pattern */}
      <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* Floating Zoom & Auto-Fit Navigation Toolbar */}
      <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-lg p-1 shadow-lg text-slate-200 select-none">
        <button
          type="button"
          onClick={handleZoomOut}
          disabled={zoom <= 0.55}
          className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent text-slate-300 hover:text-white transition-colors cursor-pointer"
          title="Zoom Out (-)"
          aria-label="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={handleResetZoom}
          className="px-1.5 py-0.5 rounded hover:bg-slate-800 text-[10px] font-mono font-bold text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
          title="Reset Zoom & Auto-fit Diagram"
          aria-label="Reset Zoom"
        >
          {Math.round(zoom * 100)}%
        </button>

        <button
          type="button"
          onClick={handleZoomIn}
          disabled={zoom >= 2.45}
          className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent text-slate-300 hover:text-white transition-colors cursor-pointer"
          title="Zoom In (+)"
          aria-label="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-3.5 bg-slate-700/80 mx-0.5" />

        <button
          type="button"
          onClick={handleResetZoom}
          className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-semibold px-1.5"
          title="Auto-Fit all ions into window"
          aria-label="Auto-Fit View"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Fit</span>
        </button>
      </div>

      {/* Floating Ratio & Formula Watermark Badge */}
      <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-2 bg-slate-900/85 backdrop-blur-md border border-slate-800 px-2.5 py-1 rounded-lg text-xs font-mono">
        <span className="text-cyan-300 font-bold">{molecule.formula}</span>
        <span className="text-slate-500">|</span>
        <span className={overallStatus.type === 'ionized' ? 'text-emerald-400 font-semibold' : 'text-slate-300'}>
          {overallStatus.badgeText}
        </span>
      </div>

      {/* Mode Instruction Pill */}
      {!isHardMode ? (
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-20 hidden sm:flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-cyan-500/40 px-3 py-1 rounded-full text-[11px] font-medium text-cyan-200 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>{overallStatus.instruction}</span>
        </div>
      ) : (
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-20 hidden sm:flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-rose-500/40 px-3 py-1 rounded-full text-[11px] font-medium text-rose-300 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-rose-400" />
          <span>Exam Mode: Place electrons onto outer valence shells</span>
        </div>
      )}

      <svg
        ref={svgRef}
        viewBox={currentViewBox}
        className={`w-full h-full ${
          isPanning ? 'cursor-grab active:cursor-grabbing' : activeTool === 'eraser' ? 'cursor-not-allowed' : 'cursor-crosshair'
        }`}
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchMove={(e) => {
          if (draggingElectronId && e.touches[0]) {
            const coords = getSvgCoordinates(e.touches[0].clientX, e.touches[0].clientY);
            if (coords) {
              hasDraggedRef.current = true;
              onUpdateElectron(draggingElectronId, coords.x, coords.y, false);
            }
          }
        }}
        onTouchEnd={(e) => {
          if (draggingElectronId) {
            if (hasDraggedRef.current && e.changedTouches[0]) {
              const coords = getSvgCoordinates(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
              if (coords) {
                const otherElectrons = placedElectrons.filter((pe) => pe.id !== draggingElectronId);
                const snapped = snapElectronPosition(molecule, coords.x, coords.y, otherElectrons);
                if (snapped) {
                  onUpdateElectron(draggingElectronId, snapped.x, snapped.y, true);
                } else if (!isHardMode && dragStartPosRef.current) {
                  onUpdateElectron(draggingElectronId, dragStartPosRef.current.x, dragStartPosRef.current.y, false);
                }
              }
            }
            setDraggingElectronId(null);
            dragStartPosRef.current = null;
            setTimeout(() => {
              hasDraggedRef.current = false;
            }, 60);
          }
        }}
      >
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="bracketGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 1. Square Brackets, Superscript Charges, & Non-Overlapping Status Badges */}
        {molecule.atoms.map((atom) => {
          const state = atomStates[atom.id];
          if (!state) return null;
          const {
            isCation,
            bracketColor,
            isFullyIonized,
            isPartiallyIonized,
            isNeutral,
            electronsLost,
            electronsGained,
            officialChargeText,
            ionName,
            initialValence,
          } = state;

          const r = atom.radius;
          const bw = 14; // Bracket arm width
          const bh = r + 18; // Bracket half-height
          const bxLeft = atom.x - r - 16;
          const bxRight = atom.x + r + 16;
          const bracketTopY = atom.y - bh;

          // Safe, non-overlapping badge pill geometry:
          // Keep the badge centered at atom.x and clamped strictly inside the brackets,
          // so it NEVER extends to the right bracket or covers the + / − charge symbols!
          const maxBadgeHalfWidth = Math.max(54, Math.min(74, r - 8));
          const badgeWidth = maxBadgeHalfWidth * 2;
          const badgeX = -maxBadgeHalfWidth;
          // Position the badge clearly above the bracket top arm
          const badgeY = Math.max(16, bracketTopY - 18);

          return (
            <g key={`brackets-${atom.id}`} className="select-none pointer-events-none transition-all duration-300">
              {/* Status Badge Above Atom / Ion (rendered first so brackets & charge symbols are always on top) */}
              <g transform={`translate(${atom.x}, ${badgeY})`} className="transition-all duration-300">
                {isNeutral ? (
                  /* Neutral Atom Tag */
                  <g>
                    <rect
                      x={badgeX}
                      y={-11}
                      width={badgeWidth}
                      height={22}
                      rx={11}
                      fill="#0f172a"
                      stroke="#475569"
                      strokeWidth="1.2"
                      className="shadow-sm"
                    />
                    <text
                      x={0}
                      y={3.5}
                      textAnchor="middle"
                      className="text-[9px] font-mono font-bold tracking-tight fill-slate-300 select-none uppercase"
                    >
                      {atom.element.isRadical ? 'Radical' : 'Atom'} ({atom.element.symbol}⁰)
                    </text>
                  </g>
                ) : isPartiallyIonized ? (
                  /* Ionizing in progress tag */
                  <g>
                    <rect
                      x={badgeX}
                      y={-11}
                      width={badgeWidth}
                      height={22}
                      rx={11}
                      fill="#1e1b4b"
                      stroke="#fbbf24"
                      strokeWidth="1.2"
                      className="shadow-sm"
                    />
                    <text
                      x={0}
                      y={3.5}
                      textAnchor="middle"
                      className="text-[9px] font-mono font-bold tracking-tight fill-amber-300 select-none uppercase"
                    >
                      ⚡ {isCation ? `Losing (+${electronsLost})` : `Gaining (${electronsGained}−)`}
                    </text>
                  </g>
                ) : (
                  /* Fully Formed Ion Badge: Cation or Anion Overlay (safely centered, never overlapping brackets or charges) */
                  <g filter="url(#bracketGlow)">
                    <rect
                      x={badgeX}
                      y={-12}
                      width={badgeWidth}
                      height={24}
                      rx={12}
                      fill={isCation ? '#2e1065' : '#064e3b'}
                      stroke={bracketColor}
                      strokeWidth="1.5"
                      className="shadow-md"
                    />
                    <text
                      x={0}
                      y={3.5}
                      textAnchor="middle"
                      className={`text-[9.5px] font-mono font-black tracking-tight select-none uppercase ${
                        isCation ? 'fill-purple-200' : 'fill-emerald-200'
                      }`}
                    >
                      ✓ {isCation ? `${atom.element.name} Cation` : ionName}
                    </text>
                  </g>
                )}
              </g>

              {/* Square brackets rendered around formed or partially formed ion */}
              {!isNeutral && (
                <>
                  {/* Left Square Bracket '[' */}
                  <path
                    d={`M ${bxLeft + bw},${atom.y - bh} L ${bxLeft},${atom.y - bh} L ${bxLeft},${atom.y + bh} L ${bxLeft + bw},${atom.y + bh}`}
                    fill="none"
                    stroke={bracketColor}
                    strokeWidth={isFullyIonized ? 2.8 : 1.8}
                    strokeDasharray={isFullyIonized ? 'none' : '4 3'}
                    strokeLinecap="square"
                    opacity={isFullyIonized ? 1 : 0.6}
                    filter={isFullyIonized ? 'url(#bracketGlow)' : undefined}
                    className="transition-all duration-300"
                  />

                  {/* Right Square Bracket ']' */}
                  <path
                    d={`M ${bxRight - bw},${atom.y - bh} L ${bxRight},${atom.y - bh} L ${bxRight},${atom.y + bh} L ${bxRight - bw},${atom.y + bh}`}
                    fill="none"
                    stroke={bracketColor}
                    strokeWidth={isFullyIonized ? 2.8 : 1.8}
                    strokeDasharray={isFullyIonized ? 'none' : '4 3'}
                    strokeLinecap="square"
                    opacity={isFullyIonized ? 1 : 0.6}
                    filter={isFullyIonized ? 'url(#bracketGlow)' : undefined}
                    className="transition-all duration-300"
                  />

                  {/* High-legibility Superscript Ion Charge (placed clearly to the right of ']' with zero occlusion) */}
                  <text
                    x={bxRight + 10}
                    y={atom.y - bh + 14}
                    textAnchor="start"
                    className="font-mono font-black select-none pointer-events-none transition-all duration-300"
                    style={{
                      fontSize: isFullyIonized ? '24px' : '17px',
                      fill: isFullyIonized
                        ? isCation
                          ? '#d8b4fe'
                          : '#6ee7b7'
                        : '#fbbf24',
                      filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.95))',
                    }}
                  >
                    {isFullyIonized
                      ? officialChargeText
                      : isCation
                      ? `+${electronsLost}`
                      : `${electronsGained}−`}
                  </text>
                </>
              )}
            </g>
          );
        })}

        {/* 2. Atom Valence Shell Circular Orbits (Visible Inner Shells with Inferred Dots/Crosses + Outermost Interactive Shell) */}
        {molecule.atoms.map((atom) => {
          const state = atomStates[atom.id];
          if (!state) return null;
          const { isCation, isFullyIonized, isPartiallyIonized, isNeutral, currentCount, initialValence } = state;

          const orbitStroke = isFullyIonized
            ? isCation
              ? '#c084fc'
              : '#34d399'
            : isPartiallyIonized
            ? '#fbbf24'
            : '#64748b';

          const assignedType: ElectronType = (atomSymbols && atomSymbols[atom.id]) || atom.symbol;
          const isDot = assignedType === 'dot';
          const innerRingStroke = isDot ? '#06b6d4' : '#f59e0b';

          return (
            <g key={`shell-${atom.id}`}>
              {/* A. Visible, Brighter Non-Interactive Inner Shells (with inferred dot/cross symbols) */}
              {atom.innerShellRadii?.map((innerR, idx) => {
                const count = atom.element.innerShells?.[idx] ?? (idx === 0 ? 2 : 8);
                const angles =
                  count === 2
                    ? [-Math.PI / 2, Math.PI / 2]
                    : count === 8
                    ? [
                        -Math.PI / 2 - 0.24,
                        -Math.PI / 2 + 0.24,
                        -0.24,
                        0.24,
                        Math.PI / 2 - 0.24,
                        Math.PI / 2 + 0.24,
                        Math.PI - 0.24,
                        -Math.PI + 0.24,
                      ]
                    : Array.from({ length: count }, (_, eIdx) => -Math.PI / 2 + (eIdx * 2 * Math.PI) / count);

                return (
                  <g key={`inner-shell-${atom.id}-${idx}`} className="pointer-events-none select-none">
                    {/* Brighter inner shell boundary glow & orbit */}
                    <circle
                      cx={atom.x}
                      cy={atom.y}
                      r={innerR}
                      fill="none"
                      stroke={innerRingStroke}
                      strokeWidth="3.5"
                      opacity="0.25"
                    />
                    <circle
                      cx={atom.x}
                      cy={atom.y}
                      r={innerR}
                      fill="none"
                      stroke={innerRingStroke}
                      strokeWidth="1.8"
                      strokeDasharray="5 3"
                      opacity="0.85"
                    />

                    {/* Pre-filled high-contrast bright inner electrons rendered as dots or crosses */}
                    {angles.map((ang, eIdx) => {
                      const ex = atom.x + innerR * Math.cos(ang);
                      const ey = atom.y + innerR * Math.sin(ang);

                      if (isDot) {
                        return (
                          <g key={`inner-e-${atom.id}-${idx}-${eIdx}`}>
                            {/* Outer soft glow */}
                            <circle
                              cx={ex}
                              cy={ey}
                              r={7}
                              fill="#06b6d4"
                              opacity="0.35"
                            />
                            {/* Crisp solid dot */}
                            <circle
                              cx={ex}
                              cy={ey}
                              r={4.8}
                              fill="#22d3ee"
                              stroke="#0891b2"
                              strokeWidth="1.2"
                              opacity="1"
                            />
                            {/* Inner specular glint */}
                            <circle
                              cx={ex - 1.5}
                              cy={ey - 1.5}
                              r={1.6}
                              fill="#ffffff"
                              opacity="0.95"
                            />
                          </g>
                        );
                      } else {
                        return (
                          <g key={`inner-e-${atom.id}-${idx}-${eIdx}`}>
                            {/* Cross backing glow */}
                            <g stroke="#f59e0b" strokeWidth="5.5" strokeLinecap="round" opacity="0.35">
                              <line x1={ex - 4.8} y1={ey - 4.8} x2={ex + 4.8} y2={ey + 4.8} />
                              <line x1={ex + 4.8} y1={ey - 4.8} x2={ex - 4.8} y2={ey + 4.8} />
                            </g>
                            {/* Crisp bold cross */}
                            <g stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" opacity="1">
                              <line x1={ex - 4.5} y1={ey - 4.5} x2={ex + 4.5} y2={ey + 4.5} />
                              <line x1={ex + 4.5} y1={ey - 4.5} x2={ex - 4.5} y2={ey + 4.5} />
                            </g>
                          </g>
                        );
                      }
                    })}

                    {/* Shell level badge */}
                    <text
                      x={atom.x}
                      y={atom.y - innerR + 11}
                      textAnchor="middle"
                      className="text-[9.5px] font-mono font-bold fill-slate-200 select-none opacity-85"
                    >
                      n={idx + 1}
                    </text>
                  </g>
                );
              })}

              {/* B. Outermost Interactive Valence Shell */}
              <circle
                cx={atom.x}
                cy={atom.y}
                r={atom.radius}
                fill="#0f172a"
                fillOpacity={isCation && isFullyIonized ? '0.15' : '0.45'}
                stroke={orbitStroke}
                strokeWidth={isFullyIonized ? 2.5 : 2.0}
                strokeDasharray={isCation && isFullyIonized ? '4 3' : 'none'}
                className="transition-all duration-300"
              />

              {/* Soft inner aura */}
              <circle
                cx={atom.x}
                cy={atom.y}
                r={atom.radius - 2}
                fill="none"
                stroke={orbitStroke}
                strokeWidth="0.8"
                opacity="0.3"
              />

              {/* Outermost shell descriptor text (with safe clearance below square bracket when ionized) */}
              <text
                x={atom.x}
                y={atom.y + atom.radius + (isNeutral ? 18 : 30)}
                textAnchor="middle"
                className="text-[9px] font-mono select-none pointer-events-none fill-slate-400 font-semibold"
                style={{ fontSize: '9.5px' }}
              >
                {isFullyIonized
                  ? isCation
                    ? `✓ Outer Shell Emptied (0e⁻ · Stable [${(atom.element.innerShells || [2, 8]).join(', ')}] Octet)`
                    : `✓ Stable Octet (8e⁻ Noble Gas Config)`
                  : isPartiallyIonized
                  ? isCation
                    ? `⚡ Losing Valence e⁻ (${currentCount} remaining)`
                    : `⚡ Gaining Valence e⁻ (${currentCount} of 8)`
                  : isCation
                  ? `Valence Shell (${initialValence} e⁻ to transfer)`
                  : atom.element.isRadical
                  ? `Radical Valence Shell (${initialValence} e⁻ · ${8 - initialValence} Vacanc${8 - initialValence === 1 ? 'y' : 'ies'})`
                  : `Valence Shell (${initialValence} e⁻ · ${8 - initialValence} Vacanc${8 - initialValence === 1 ? 'y' : 'ies'})`}
              </text>
            </g>
          );
        })}

        {/* 3. Atom Nuclei (Center Badges) */}
        {molecule.atoms.map((atom) => {
          const state = atomStates[atom.id];
          const isRadical = atom.element.isRadical || atom.element.symbol.length > 2;
          const isIon = state?.isFullyIonized ?? false;
          const isCation = atom.role === 'cation';
          const officialChargeText = state?.officialChargeText || (isCation ? '⁺' : '⁻');
          const ionName = state?.ionName || `${atom.element.name} Ion`;

          return (
            <g key={`nucleus-${atom.id}`} className="pointer-events-none select-none">
              {/* Nucleus Core Badge */}
              {isRadical ? (
                <rect
                  x={atom.x - 32}
                  y={atom.y - 25}
                  width={64}
                  height={50}
                  rx={22}
                  fill={atom.element.color}
                  stroke={isIon ? (isCation ? '#c084fc' : '#34d399') : '#ffffff'}
                  strokeWidth={isIon ? 2.5 : 1.5}
                  className="shadow-lg transition-all duration-300"
                  filter="url(#glow)"
                />
              ) : (
                <circle
                  cx={atom.x}
                  cy={atom.y}
                  r={25}
                  fill={atom.element.color}
                  stroke={isIon ? (isCation ? '#c084fc' : '#34d399') : '#ffffff'}
                  strokeWidth={isIon ? 2.5 : 1.5}
                  className="shadow-lg transition-all duration-300"
                  filter="url(#glow)"
                />
              )}

              {/* Atomic / Ion Symbol */}
              <text
                x={atom.x}
                y={atom.y + 6}
                textAnchor="middle"
                className="font-extrabold fill-white select-none pointer-events-none tracking-wider transition-all duration-300"
                style={{ fontSize: isRadical ? (isIon ? '12px' : '14px') : (isIon ? '14px' : '16px') }}
              >
                {isIon ? `[${atom.element.symbol}]${officialChargeText}` : atom.element.symbol}
              </text>

              {/* Top Tag: Atomic Number when Atom / Charge when Ion */}
              <text
                x={atom.x}
                y={atom.y - 12}
                textAnchor="middle"
                className="text-[9px] font-mono fill-slate-300 select-none pointer-events-none"
                style={{ fontSize: isRadical ? '8px' : '9px' }}
              >
                {isIon
                  ? `${isCation ? 'Cation' : 'Anion'} ${officialChargeText}`
                  : isRadical
                  ? 'Radical'
                  : `Z = ${atom.element.atomicNumber}`}
              </text>

              {/* Element or Ion Name */}
              <text
                x={atom.x}
                y={atom.y + 20}
                textAnchor="middle"
                className="text-[9px] font-mono select-none pointer-events-none font-semibold fill-slate-300"
                style={{ fontSize: isIon ? '8px' : '9px' }}
              >
                {isIon
                  ? isCation
                    ? `${atom.element.name} Cation`
                    : ionName
                  : `${atom.element.name} Atom`}
              </text>
            </g>
          );
        })}

        {/* 4. Optional Faint Educational Guide (Only if hints manually toggled ON in Guided Mode) */}
        {!isHardMode && showHints && (
          <g opacity="0.35" className="pointer-events-none">
            {idealGhostHints.map((gh) => (
              <g key={`ghost-${gh.id}`} transform={`translate(${gh.x}, ${gh.y})`}>
                {gh.type === 'dot' ? (
                  <circle r={6.5} fill="#06b6d4" />
                ) : (
                  <g stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="-5" y1="-5" x2="5" y2="5" />
                    <line x1="5" y1="-5" x2="-5" y2="5" />
                  </g>
                )}
              </g>
            ))}
          </g>
        )}

        {/* 4.5. Guided Mode Vacancy Drop Targets on Non-Metal Anions */}
        {!isHardMode && (
          <g className="pointer-events-none select-none">
            {molecule.atoms
              .filter((a) => a.role === 'anion')
              .map((anion) => {
                const anionElectrons = placedElectrons.filter(
                  (pe) => pe.id !== draggingElectronId && Math.hypot(pe.x - anion.x, pe.y - anion.y) <= anion.radius + 30
                );
                const occupiedAngles = anionElectrons.map((pe) => Math.atan2(pe.y - anion.y, pe.x - anion.x));

                const vacantAngles = standardOctetAngles.filter((stdAngle) => {
                  return !occupiedAngles.some((occ) => {
                    let diff = Math.abs(occ - stdAngle);
                    if (diff > Math.PI) diff = 2 * Math.PI - diff;
                    return diff < 0.25;
                  });
                });

                const isActivelyDragging = !!draggingElectronId;

                return vacantAngles.map((ang, vIdx) => {
                  const vx = Math.round(anion.x + anion.radius * Math.cos(ang));
                  const vy = Math.round(anion.y + anion.radius * Math.sin(ang));

                  return (
                    <g key={`vacancy-${anion.id}-${vIdx}`}>
                      <circle
                        cx={vx}
                        cy={vy}
                        r={isActivelyDragging ? 14 : 10}
                        fill={isActivelyDragging ? 'rgba(56, 189, 248, 0.22)' : 'none'}
                        stroke="#38bdf8"
                        strokeWidth={isActivelyDragging ? 2.2 : 1.4}
                        strokeDasharray="4 3"
                        opacity={isActivelyDragging ? 0.95 : 0.45}
                        className={isActivelyDragging ? 'animate-pulse' : ''}
                      />
                      <text
                        x={vx}
                        y={vy + 3.5}
                        textAnchor="middle"
                        className="font-mono font-bold select-none"
                        style={{
                          fontSize: isActivelyDragging ? '12px' : '9.5px',
                          fill: '#38bdf8',
                          opacity: isActivelyDragging ? 1 : 0.55,
                        }}
                      >
                        +
                      </text>
                    </g>
                  );
                });
              })}
          </g>
        )}

        {/* 4.6. Guided Mode Drag Tether Line */}
        {!isHardMode && draggingElectronId && dragStartPosRef.current && (
          <g className="pointer-events-none select-none">
            {(() => {
              const currentDragging = placedElectrons.find((pe) => pe.id === draggingElectronId);
              if (!currentDragging) return null;
              return (
                <line
                  x1={dragStartPosRef.current.x}
                  y1={dragStartPosRef.current.y}
                  x2={currentDragging.x}
                  y2={currentDragging.y}
                  stroke={currentDragging.type === 'dot' ? '#06b6d4' : '#f59e0b'}
                  strokeWidth="2.5"
                  strokeDasharray="5 4"
                  opacity="0.75"
                />
              );
            })()}
          </g>
        )}

        {/* 5. Placed Electrons (Freely Positioned / Transferred by Student) */}
        {placedElectrons.map((electron) => {
          const isOnCation = molecule.atoms.some(
            (a) => a.role === 'cation' && Math.hypot(electron.x - a.x, electron.y - a.y) <= a.radius + 30
          );
          const isCurrentDrag = draggingElectronId === electron.id;

          return (
            <g
              key={electron.id}
              transform={`translate(${electron.x}, ${electron.y})`}
              className="cursor-grab active:cursor-grabbing group select-none"
              onClick={(e) => {
                e.stopPropagation();
                if (hasDraggedRef.current) {
                  hasDraggedRef.current = false;
                  return;
                }
                if (!isHardMode && activeTool !== 'eraser') return;
                if (activeTool === 'eraser' || electron.type === activeTool) {
                  onRemoveElectron(electron.id);
                } else if (isHardMode) {
                  const swapId =
                    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
                      ? `elec-${crypto.randomUUID()}`
                      : `elec-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
                  onRemoveElectron(electron.id);
                  onPlaceElectron({ ...electron, id: swapId, type: activeTool });
                }
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                setDraggingElectronId(electron.id);
                dragStartPosRef.current = { x: electron.x, y: electron.y };
                hasDraggedRef.current = false;
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                if (e.touches[0]) {
                  const coords = getSvgCoordinates(e.touches[0].clientX, e.touches[0].clientY);
                  setDraggingElectronId(electron.id);
                  dragStartPosRef.current = coords ?? { x: electron.x, y: electron.y };
                  hasDraggedRef.current = false;
                }
              }}
            >
              {/* Guided Mode Draggable Cue on Metal Outer Electrons */}
              {!isHardMode && isOnCation && !isCurrentDrag && (
                <g className="pointer-events-none select-none">
                  {/* Pulsing draggable halo */}
                  <circle
                    r={18}
                    fill="none"
                    stroke={electron.type === 'dot' ? '#06b6d4' : '#f59e0b'}
                    strokeWidth={1.8}
                    strokeDasharray="4 3"
                    className="animate-pulse"
                    opacity={0.85}
                  />
                  {/* Directional Tag */}
                  <g transform="translate(0, -18)">
                    <rect
                      x="-20"
                      y="-11"
                      width="40"
                      height="12"
                      rx="3"
                      fill="#0f172a"
                      fillOpacity="0.9"
                      stroke={electron.type === 'dot' ? '#06b6d4' : '#f59e0b'}
                      strokeWidth="1"
                    />
                    <text
                      y="-2.5"
                      textAnchor="middle"
                      className="text-[8px] font-mono font-bold"
                      fill={electron.type === 'dot' ? '#22d3ee' : '#fbbf24'}
                    >
                      DRAG ➔
                    </text>
                  </g>
                </g>
              )}

              {/* Click target hit circle */}
              <circle
                r={isCurrentDrag ? 17 : 14}
                fill="rgba(15, 23, 42, 0.95)"
                stroke={electron.type === 'dot' ? '#06b6d4' : '#f59e0b'}
                strokeWidth={isCurrentDrag ? 2.5 : 1.8}
                filter={isCurrentDrag ? 'url(#glow)' : undefined}
              />

              {/* Placed Dot representation (Metal origin) */}
              {electron.type === 'dot' && (
                <g filter="url(#glow)">
                  <circle r={8} fill="#06b6d4" fillOpacity="0.35" />
                  <circle r={6.5} fill="#06b6d4" />
                  <circle cx={-2} cy={-2} r={2} fill="#ffffff" fillOpacity="0.8" />
                </g>
              )}

              {/* Placed Cross representation (Non-Metal origin) */}
              {electron.type === 'cross' && (
                <g
                  filter="url(#glow)"
                  stroke="#f59e0b"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  className="transition-transform duration-150"
                >
                  <line x1="-6.5" y1="-6.5" x2="6.5" y2="6.5" />
                  <line x1="6.5" y1="-6.5" x2="-6.5" y2="6.5" />
                </g>
              )}
            </g>
          );
        })}

        {/* 6. Active Tool Hover Cursor Preview */}
        {hoverCoord && activeTool !== 'eraser' && (
          <g
            transform={`translate(${hoverCoord.x}, ${hoverCoord.y})`}
            opacity="0.45"
            className="pointer-events-none"
          >
            {activeTool === 'dot' ? (
              <circle r={6.5} fill="#06b6d4" />
            ) : (
              <g stroke="#f59e0b" strokeWidth="3" strokeLinecap="round">
                <line x1="-6" y1="-6" x2="6" y2="6" />
                <line x1="6" y1="-6" x2="-6" y2="6" />
              </g>
            )}
          </g>
        )}
      </svg>
    </div>
  );
};
