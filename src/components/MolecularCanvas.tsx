/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize2, ArrowRight } from 'lucide-react';
import { MoleculeDefinition, ElectronType, PlacedElectron } from '../types/chemistry';
import { snapElectronPosition, classifyElectron, generateIdealPositions } from '../utils/geometry';

interface MolecularCanvasProps {
  molecule: MoleculeDefinition;
  placedElectrons: PlacedElectron[];
  activeTool: 'dot' | 'cross' | 'eraser';
  onPlaceElectron: (electron: PlacedElectron) => void;
  onRemoveElectron: (id: string) => void;
  onUpdateElectron: (id: string, x: number, y: number) => void;
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
    if (hasMovedRef.current) {
      hasMovedRef.current = false;
      return;
    }

    const coords = getSvgCoordinates(e.clientX, e.clientY);
    if (!coords) return;

    // Check if clicking existing electron
    const existing = findElectronAt(coords.x, coords.y);
    if (existing) {
      if (activeTool === 'eraser' || existing.type === activeTool) {
        onRemoveElectron(existing.id);
      } else {
        const swapId =
          typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? `elec-${crypto.randomUUID()}`
            : `elec-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        onRemoveElectron(existing.id);
        onPlaceElectron({ ...existing, id: swapId, type: activeTool });
      }
      return;
    }

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
        onUpdateElectron(draggingElectronId, snapped.x, snapped.y);
      }
      setDraggingElectronId(null);
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
      const otherElectrons = placedElectrons.filter((pe) => pe.id !== draggingElectronId);
      const snapped = snapElectronPosition(molecule, coords.x, coords.y, otherElectrons);
      if (snapped) {
        onUpdateElectron(draggingElectronId, snapped.x, snapped.y);
      }
      return;
    }

    const classification = classifyElectron(molecule, coords.x, coords.y);
    if (classification.region !== 'outside') {
      const snapped = snapElectronPosition(molecule, coords.x, coords.y, placedElectrons);
      setHoverCoord(snapped ?? coords);
    } else {
      setHoverCoord(null);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingElectronId(null);
  };

  const handleMouseLeave = () => {
    setHoverCoord(null);
    setDraggingElectronId(null);
    setIsPanning(false);
  };

  const idealGhostHints = !isHardMode && showHints ? generateIdealPositions(molecule, atomSymbols) : [];

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
        <span className="text-slate-300">{molecule.bondTypeSummary}</span>
      </div>

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

        {/* 1. Square Brackets & Superscript Charges for Each Ion */}
        {molecule.atoms.map((atom) => {
          const r = atom.radius;
          const bw = 14; // Bracket arm width
          const bh = r + 18; // Bracket half-height
          const bxLeft = atom.x - r - 16;
          const bxRight = atom.x + r + 16;

          const isCation = atom.role === 'cation';
          const bracketColor = isCation ? '#a855f7' : '#10b981';
          const chargeText = isCation
            ? atom.element.ionCharge === 1
              ? '⁺'
              : `${atom.element.ionCharge}⁺`
            : Math.abs(atom.element.ionCharge) === 1
            ? '⁻'
            : `${Math.abs(atom.element.ionCharge)}⁻`;

          return (
            <g key={`brackets-${atom.id}`} className="select-none pointer-events-none">
              {/* Left Square Bracket '[' */}
              <path
                d={`M ${bxLeft + bw},${atom.y - bh} L ${bxLeft},${atom.y - bh} L ${bxLeft},${atom.y + bh} L ${bxLeft + bw},${atom.y + bh}`}
                fill="none"
                stroke={bracketColor}
                strokeWidth="2.5"
                strokeLinecap="square"
                opacity="0.9"
                filter="url(#bracketGlow)"
              />

              {/* Right Square Bracket ']' */}
              <path
                d={`M ${bxRight - bw},${atom.y - bh} L ${bxRight},${atom.y - bh} L ${bxRight},${atom.y + bh} L ${bxRight - bw},${atom.y + bh}`}
                fill="none"
                stroke={bracketColor}
                strokeWidth="2.5"
                strokeLinecap="square"
                opacity="0.9"
                filter="url(#bracketGlow)"
              />

              {/* High-legibility Superscript Ion Charge */}
              <text
                x={bxRight + 8}
                y={atom.y - bh + 14}
                className="font-mono font-black select-none pointer-events-none"
                style={{
                  fontSize: '22px',
                  fill: isCation ? '#c084fc' : '#34d399',
                  filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.8))',
                }}
              >
                {chargeText}
              </text>

              {/* Role badge (Cation vs Anion) */}
              <text
                x={atom.x}
                y={atom.y - r - 26}
                textAnchor="middle"
                className="text-[10px] font-mono font-bold tracking-wider select-none uppercase pointer-events-none"
                style={{
                  fill: isCation ? '#c084fc' : '#34d399',
                  fontSize: '10px',
                }}
              >
                {isCation ? 'Metal Cation' : 'Non-Metal Anion'}
              </text>
            </g>
          );
        })}

        {/* 2. Atom Valence Shell Circular Orbits */}
        {molecule.atoms.map((atom) => {
          const isCation = atom.role === 'cation';
          const orbitStroke = isCation ? '#8b5cf6' : '#10b981';

          return (
            <g key={`shell-${atom.id}`}>
              {/* Outer boundary circular ring */}
              <circle
                cx={atom.x}
                cy={atom.y}
                r={atom.radius}
                fill="#0f172a"
                fillOpacity="0.45"
                stroke={orbitStroke}
                strokeWidth="2"
                strokeDasharray={isCation ? '4 3' : 'none'}
                className="transition-colors duration-300"
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

              {/* Empty outer shell indication for cation if emptied */}
              {isCation && (
                <text
                  x={atom.x}
                  y={atom.y + atom.radius + 18}
                  textAnchor="middle"
                  className="text-[9px] font-mono select-none pointer-events-none fill-slate-400 font-semibold"
                  style={{ fontSize: '9.5px' }}
                >
                  Outer Shell Emptied
                </text>
              )}
            </g>
          );
        })}

        {/* 3. Atom Nuclei (Center Badges) */}
        {molecule.atoms.map((atom) => (
          <g key={`nucleus-${atom.id}`} className="pointer-events-none select-none">
            {/* Nucleus Core Circle */}
            <circle
              cx={atom.x}
              cy={atom.y}
              r={24}
              fill={atom.element.color}
              stroke="#ffffff"
              strokeWidth="1.5"
              className="shadow-lg"
              filter="url(#glow)"
            />

            {/* Atomic Symbol */}
            <text
              x={atom.x}
              y={atom.y + 6}
              textAnchor="middle"
              className="text-base font-extrabold fill-white select-none pointer-events-none tracking-wider"
              style={{ fontSize: '16px' }}
            >
              {atom.element.symbol}
            </text>

            {/* Atomic number badge */}
            <text
              x={atom.x}
              y={atom.y - 12}
              textAnchor="middle"
              className="text-[9px] font-mono fill-slate-300 select-none pointer-events-none"
              style={{ fontSize: '9px' }}
            >
              {atom.element.atomicNumber}
            </text>

            {/* Element Name */}
            <text
              x={atom.x}
              y={atom.y + 20}
              textAnchor="middle"
              className="text-[9px] font-mono select-none pointer-events-none font-semibold fill-slate-300"
              style={{ fontSize: '9px' }}
            >
              {atom.element.name}
            </text>
          </g>
        ))}

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

        {/* 5. Placed Electrons (Freely Positioned / Transferred by Student) */}
        {placedElectrons.map((electron) => (
          <g
            key={electron.id}
            transform={`translate(${electron.x}, ${electron.y})`}
            className="cursor-grab active:cursor-grabbing group"
            onClick={(e) => {
              e.stopPropagation();
              if (activeTool === 'eraser' || electron.type === activeTool) {
                onRemoveElectron(electron.id);
              } else {
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
            }}
          >
            {/* Click target hit circle */}
            <circle
              r={14}
              fill="rgba(15, 23, 42, 0.95)"
              stroke={electron.type === 'dot' ? '#06b6d4' : '#f59e0b'}
              strokeWidth={1.8}
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
        ))}

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
