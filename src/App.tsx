/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { MOLECULES, getRandomEndlessMolecule } from './data/molecules';
import { MoleculeDefinition, ElectronType, EndlessState, EndlessType, PlacedElectron } from './types/chemistry';
import { validateMolecule } from './utils/validation';
import { generateIdealPositions, generateNeutralStartingPositions } from './utils/geometry';
import { soundEffects } from './utils/audio';
import { Navbar } from './components/Navbar';
import { MolecularCanvas } from './components/MolecularCanvas';
import { ElectronTray } from './components/ElectronTray';
import { ValidationPanel } from './components/ValidationPanel';
import { MoleculeSelector } from './components/MoleculeSelector';
import { Molecule3DViewer } from './components/Molecule3DViewer';
import { StepByStepGuide } from './components/StepByStepGuide';
import { PeriodicTableReference } from './components/PeriodicTableReference';
import { EndlessModeHUD } from './components/EndlessModeHUD';
import { GameOverModal } from './components/GameOverModal';
import { Sparkles, ShieldCheck, Flame, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  const [currentMoleculeIndex, setCurrentMoleculeIndex] = useState<number>(0);
  const [endlessMolecule, setEndlessMolecule] = useState<MoleculeDefinition>(() =>
    getRandomEndlessMolecule(1)
  );

  // Placed electrons for the active compound
  const [placedElectrons, setPlacedElectrons] = useState<PlacedElectron[]>([]);

  // Active electron tool
  const [activeTool, setActiveTool] = useState<'dot' | 'cross' | 'eraser'>('dot');

  // Hints toggle
  const [showHints, setShowHints] = useState<boolean>(false);

  // Sound toggle
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Hard Mode toggle (hides valence numbers and charge hints)
  const [isHardMode, setIsHardMode] = useState<boolean>(() => {
    try {
      return (
        localStorage.getItem('ionic_hard_mode') === 'true' ||
        localStorage.getItem('covalent_hard_mode') === 'true'
      );
    } catch {
      return false;
    }
  });

  const handleToggleHardMode = () => {
    setIsHardMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('ionic_hard_mode', next.toString());
      } catch {
        // ignore
      }
      if (next) {
        setShowHints(false);
        soundEffects.playNotice();
      } else {
        soundEffects.playPlace('dot');
      }
      return next;
    });
  };

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'builder' | 'endless' | 'guide' | 'periodictable' | 'viewer3d'>('builder');

  // Curriculum completed compounds set
  const [completedMolecules, setCompletedMolecules] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('ionic_lab_completed') || localStorage.getItem('covalent_lab_completed');
      return saved ? new Set(JSON.parse(saved)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });

  // Endless Mode State
  const [endlessState, setEndlessState] = useState<EndlessState>(() => {
    let savedHighScore = 0;
    try {
      const saved = localStorage.getItem('ionic_high_score') || localStorage.getItem('covalent_high_score');
      if (saved) savedHighScore = parseInt(saved, 10) || 0;
    } catch {
      // ignore
    }

    return {
      isActive: false,
      type: 'blitz',
      score: 0,
      highScore: savedHighScore,
      streak: 0,
      bestStreak: 0,
      multiplier: 1.0,
      timeLeft: 60,
      lives: 3,
      wave: 1,
      moleculesSolved: 0,
      hintsUsedInRound: 0,
      roundStartTime: Date.now(),
      isGameOver: false,
    };
  });

  // Power-up availability in Endless mode
  const [sparkAvailable, setSparkAvailable] = useState<boolean>(true);
  const [scanAvailable, setScanAvailable] = useState<boolean>(true);

  // Round clear notification banner
  const [roundClearBanner, setRoundClearBanner] = useState<string | null>(null);

  // Survival / Endless mode submission feedback alert
  const [submissionAlert, setSubmissionAlert] = useState<{
    type: 'error' | 'warning' | 'success';
    message: string;
  } | null>(null);

  // Active compound based on tab
  const isEndless = activeTab === 'endless';
  const currentMolecule = isEndless ? endlessMolecule : MOLECULES[currentMoleculeIndex];

  // Calculate live validation feedback
  const feedback = useMemo(() => {
    return validateMolecule(currentMolecule, placedElectrons);
  }, [currentMolecule, placedElectrons]);

  // Synchronize audio setting
  useEffect(() => {
    soundEffects.enabled = soundEnabled;
  }, [soundEnabled]);

  // Reset placed electrons when changing compound in curriculum
  const handleSelectMolecule = (molecule: MoleculeDefinition) => {
    const idx = MOLECULES.findIndex((m) => m.id === molecule.id);
    if (idx !== -1) {
      setCurrentMoleculeIndex(idx);
      setPlacedElectrons([]);
      setActiveTool('dot');
      setShowHints(false);
      setSubmissionAlert(null);
    }
  };

  // Place electron freely
  const handlePlaceElectron = (electron: PlacedElectron) => {
    const generateUniqueId = () =>
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? `elec-${crypto.randomUUID()}`
        : `elec-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    setPlacedElectrons((prev) => {
      const isDuplicate = !electron.id || prev.some((e) => e.id === electron.id);
      const finalId = isDuplicate ? generateUniqueId() : electron.id;

      const filtered = prev.filter(
        (e) => e.id !== electron.id && e.id !== finalId && !(Math.hypot(e.x - electron.x, e.y - electron.y) < 6)
      );

      const placedItem: PlacedElectron = {
        ...electron,
        id: finalId,
      };

      const nextState = [...filtered, placedItem];

      // Auto-submission logic for timed mode
      const isSurvivalHardMode = isEndless && endlessState.type === 'streak' && isHardMode;
      const newFeedback = validateMolecule(currentMolecule, nextState);

      if (newFeedback.isValid) {
        if (isEndless) {
          if (!isSurvivalHardMode) {
            handleEndlessRoundWon(false);
          }
        } else {
          if (!completedMolecules.has(currentMolecule.id)) {
            soundEffects.playSuccess();
            const nextCompleted = new Set(completedMolecules);
            nextCompleted.add(currentMolecule.id);
            setCompletedMolecules(nextCompleted);
            try {
              localStorage.setItem('ionic_lab_completed', JSON.stringify(Array.from(nextCompleted)));
            } catch {
              // ignore
            }
          }
        }
      }

      return nextState;
    });

    soundEffects.playPlace(electron.type);
  };

  // Remove electron by id
  const handleRemoveElectron = (id: string) => {
    setPlacedElectrons((prev) => prev.filter((e) => e.id !== id));
    soundEffects.playRemove();
  };

  // Update electron coordinates (drag repositions)
  const handleUpdateElectron = (id: string, x: number, y: number) => {
    const nextState = placedElectrons.map((e) => (e.id === id ? { ...e, x, y } : e));
    setPlacedElectrons(nextState);

    const isSurvivalHardMode = isEndless && endlessState.type === 'streak' && isHardMode;
    const newFeedback = validateMolecule(currentMolecule, nextState);
    if (newFeedback.isValid) {
      if (isEndless) {
        if (!isSurvivalHardMode) {
          handleEndlessRoundWon(false);
        }
      } else {
        if (!completedMolecules.has(currentMolecule.id)) {
          soundEffects.playSuccess();
          const nextCompleted = new Set(completedMolecules);
          nextCompleted.add(currentMolecule.id);
          setCompletedMolecules(nextCompleted);
          try {
            localStorage.setItem('ionic_lab_completed', JSON.stringify(Array.from(nextCompleted)));
          } catch {
            // ignore
          }
        }
      }
    }
  };

  // Clear all electrons on current canvas
  const handleClearElectrons = () => {
    setPlacedElectrons([]);
    soundEffects.playRemove();
  };

  // Load neutral starting atoms (before electron transfer)
  const handleLoadNeutralAtoms = () => {
    const neutral = generateNeutralStartingPositions(currentMolecule);
    setPlacedElectrons(neutral);
    soundEffects.playNotice();
  };

  // Provide 1-step hint
  const handleProvideStepHint = () => {
    const ideal = generateIdealPositions(currentMolecule, feedback.atomSymbols);
    const missing = ideal.find((ie) => {
      return !placedElectrons.some((pe) => Math.hypot(pe.x - ie.x, pe.y - ie.y) < 22);
    });

    if (missing) {
      if (isEndless) {
        setEndlessState((prev) => ({ ...prev, hintsUsedInRound: prev.hintsUsedInRound + 1 }));
      }
      const hintId =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? `elec-hint-${crypto.randomUUID()}`
          : `elec-hint-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      handlePlaceElectron({
        id: hintId,
        x: missing.x,
        y: missing.y,
        type: missing.type,
      });
    }
  };

  // Auto-solve / Reveal complete diagram
  const handleAutoSolve = () => {
    const ideal = generateIdealPositions(currentMolecule, feedback.atomSymbols);
    const idealWithUniqueIds = ideal.map((e) => ({
      ...e,
      id:
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? `elec-ideal-${crypto.randomUUID()}`
          : `elec-ideal-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    }));
    setPlacedElectrons(idealWithUniqueIds);
    soundEffects.playSuccess();

    if (isEndless) {
      handleEndlessRoundWon(true);
    } else {
      if (!completedMolecules.has(currentMolecule.id)) {
        const nextCompleted = new Set(completedMolecules);
        nextCompleted.add(currentMolecule.id);
        setCompletedMolecules(nextCompleted);
        try {
          localStorage.setItem('ionic_lab_completed', JSON.stringify(Array.from(nextCompleted)));
        } catch {
          // ignore
        }
      }
    }
  };

  // ----------------------------------------------------
  // ENDLESS MODE GAME LOOP & LOGIC
  // ----------------------------------------------------

  // Blitz mode countdown timer
  useEffect(() => {
    if (activeTab !== 'endless' || endlessState.type !== 'blitz' || endlessState.isGameOver) {
      return;
    }

    const timer = setInterval(() => {
      setEndlessState((prev) => {
        if (prev.timeLeft <= 1) {
          soundEffects.playGameOver();
          return { ...prev, timeLeft: 0, isGameOver: true };
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeTab, endlessState.type, endlessState.isGameOver]);

  // Round Won in Endless
  const handleEndlessRoundWon = (wasAutoSolved = false) => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#a855f7', '#10b981', '#06b6d4', '#f59e0b'],
    });

    const roundDuration = (Date.now() - endlessState.roundStartTime) / 1000;
    const isSpeedy = roundDuration < 25;
    const isFlawless = endlessState.hintsUsedInRound === 0 && !wasAutoSolved;

    let pointsEarned = 100;
    if (isSpeedy) pointsEarned += 50;
    if (isFlawless) pointsEarned += 30;
    if (wasAutoSolved) pointsEarned = 25;
    if (isHardMode) pointsEarned = Math.round(pointsEarned * 2);

    const roundScore = Math.round(pointsEarned * endlessState.multiplier);
    const newStreak = wasAutoSolved ? 0 : endlessState.streak + 1;
    const newBestStreak = Math.max(newStreak, endlessState.bestStreak);
    const newMultiplier = Math.min(3.0, 1.0 + newStreak * 0.2);
    const newScore = endlessState.score + roundScore;
    const newHighScore = Math.max(newScore, endlessState.highScore);
    const nextWave = Math.floor((endlessState.moleculesSolved + 1) / 3) + 1;

    const bonusSeconds = endlessState.type === 'blitz' ? 15 : 0;
    if (bonusSeconds > 0) {
      soundEffects.playTimeBonus();
    } else {
      soundEffects.playStreak(newStreak);
    }

    setEndlessState((prev) => ({
      ...prev,
      score: newScore,
      highScore: newHighScore,
      streak: newStreak,
      bestStreak: newBestStreak,
      multiplier: newMultiplier,
      timeLeft: Math.min(120, prev.timeLeft + bonusSeconds),
      wave: nextWave,
      moleculesSolved: prev.moleculesSolved + 1,
      hintsUsedInRound: 0,
      roundStartTime: Date.now(),
    }));

    try {
      localStorage.setItem('ionic_high_score', newHighScore.toString());
    } catch {
      // ignore
    }

    setSparkAvailable(true);
    setScanAvailable(true);

    setRoundClearBanner(
      `+${roundScore} pts ${isHardMode ? '(2x Exam Bonus!) ' : ''}! Wave ${nextWave} Incoming...`
    );
    setTimeout(() => setRoundClearBanner(null), 1800);

    setTimeout(() => {
      const nextMol = getRandomEndlessMolecule(nextWave, endlessMolecule.id);
      setEndlessMolecule(nextMol);
      setPlacedElectrons([]);
      setShowHints(false);
      setActiveTool('dot');
      setSubmissionAlert(null);
    }, 700);
  };

  // Skip compound in Endless
  const handleSkipEndlessMolecule = () => {
    soundEffects.playNotice();
    setSubmissionAlert(null);

    if (endlessState.type === 'streak') {
      const newLives = endlessState.lives - 1;
      soundEffects.playLifeLost();

      if (newLives <= 0) {
        soundEffects.playGameOver();
        setEndlessState((prev) => ({
          ...prev,
          lives: 0,
          streak: 0,
          isGameOver: true,
        }));
        return;
      }

      setEndlessState((prev) => ({
        ...prev,
        lives: newLives,
        streak: 0,
        multiplier: 1.0,
        roundStartTime: Date.now(),
      }));
    } else {
      setEndlessState((prev) => {
        const nextTime = Math.max(0, prev.timeLeft - 10);
        if (nextTime === 0) {
          soundEffects.playGameOver();
          return { ...prev, timeLeft: 0, streak: 0, isGameOver: true };
        }
        return {
          ...prev,
          timeLeft: nextTime,
          streak: 0,
          multiplier: 1.0,
          roundStartTime: Date.now(),
        };
      });
    }

    const nextMol = getRandomEndlessMolecule(endlessState.wave, endlessMolecule.id);
    setEndlessMolecule(nextMol);
    setPlacedElectrons([]);
    setShowHints(false);
  };

  // Power-up: Ion Spark (Transfers/completes 1 electron into an anion)
  const handleUseBondSpark = () => {
    if (!sparkAvailable) return;
    const ideal = generateIdealPositions(currentMolecule, feedback.atomSymbols);
    const missing = ideal.filter(
      (ie) => !placedElectrons.some((pe) => Math.hypot(pe.x - ie.x, pe.y - ie.y) < 20)
    );

    if (missing.length === 0) return;

    // Pick up to 2 missing electrons
    const toAdd = missing.slice(0, Math.min(2, missing.length)).map((e) => ({
      ...e,
      id:
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? `elec-spark-${crypto.randomUUID()}`
          : `elec-spark-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    }));

    const nextState = [...placedElectrons, ...toAdd];
    setPlacedElectrons(nextState);
    setSparkAvailable(false);
    soundEffects.playPlace('dot');

    const isSurvivalHardMode = isEndless && endlessState.type === 'streak' && isHardMode;
    const check = validateMolecule(currentMolecule, nextState);
    if (check.isValid && !isSurvivalHardMode) {
      handleEndlessRoundWon(false);
    }
  };

  // Manual Submission in Survival / Endless Mode
  const handleSubmitEndlessAnswer = () => {
    if (placedElectrons.length === 0) {
      soundEffects.playNotice();
      setSubmissionAlert({
        type: 'warning',
        message: 'Place electrons on the atom shells before submitting!',
      });
      setTimeout(() => setSubmissionAlert(null), 2500);
      return;
    }

    const check = validateMolecule(currentMolecule, placedElectrons);
    if (check.isValid) {
      setSubmissionAlert(null);
      handleEndlessRoundWon(false);
    } else {
      if (endlessState.type === 'streak') {
        const newLives = endlessState.lives - 1;
        soundEffects.playLifeLost();

        if (newLives <= 0) {
          soundEffects.playGameOver();
          setEndlessState((prev) => ({
            ...prev,
            lives: 0,
            streak: 0,
            isGameOver: true,
          }));
          return;
        }

        setEndlessState((prev) => ({
          ...prev,
          lives: newLives,
          streak: 0,
          multiplier: 1.0,
        }));

        setSubmissionAlert({
          type: 'error',
          message: `Incorrect diagram! -1 Life (${newLives} remaining). Ensure metal outer shell is emptied and non-metal has 8 e⁻!`,
        });
        setTimeout(() => setSubmissionAlert(null), 3500);
      } else {
        soundEffects.playLifeLost();
        setEndlessState((prev) => {
          const nextTime = Math.max(0, prev.timeLeft - 10);
          if (nextTime === 0) {
            soundEffects.playGameOver();
            return { ...prev, timeLeft: 0, streak: 0, isGameOver: true };
          }
          return {
            ...prev,
            timeLeft: nextTime,
            streak: 0,
            multiplier: 1.0,
          };
        });

        setSubmissionAlert({
          type: 'error',
          message: 'Incorrect diagram! -10s penalty. Check your electron transfers and charges!',
        });
        setTimeout(() => setSubmissionAlert(null), 3500);
      }
    }
  };

  // Power-up: Octet Scan
  const handleUseOctetScan = () => {
    if (!scanAvailable) return;
    setShowHints(true);
    setScanAvailable(false);
    soundEffects.playNotice();
  };

  // Restart Endless Run
  const handleRestartEndless = () => {
    const nextMol = getRandomEndlessMolecule(1);
    setEndlessMolecule(nextMol);
    setPlacedElectrons([]);
    setShowHints(false);
    setActiveTool('dot');
    setSparkAvailable(true);
    setScanAvailable(true);
    setSubmissionAlert(null);
    setEndlessState((prev) => ({
      ...prev,
      score: 0,
      streak: 0,
      multiplier: 1.0,
      timeLeft: 60,
      lives: 3,
      wave: 1,
      moleculesSolved: 0,
      hintsUsedInRound: 0,
      roundStartTime: Date.now(),
      isGameOver: false,
    }));
  };

  // Change Endless Type (Blitz vs Streak)
  const handleChangeEndlessType = (newType: EndlessType) => {
    const nextMol = getRandomEndlessMolecule(1);
    setEndlessMolecule(nextMol);
    setPlacedElectrons([]);
    setShowHints(false);
    setSubmissionAlert(null);
    setEndlessState((prev) => ({
      ...prev,
      type: newType,
      score: 0,
      streak: 0,
      multiplier: 1.0,
      timeLeft: 60,
      lives: 3,
      wave: 1,
      moleculesSolved: 0,
      roundStartTime: Date.now(),
      isGameOver: false,
    }));
  };

  // Keyboard shortcuts (1 for Dot, 2 for Cross, 3 for Eraser, H for Hints)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === '1') setActiveTool('dot');
      if (e.key === '2') setActiveTool('cross');
      if (e.key === '3') setActiveTool('eraser');
      if (e.key === 'h' || e.key === 'H') setShowHints((prev) => !prev);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const hasNextMolecule = currentMoleculeIndex < MOLECULES.length - 1;
  const hasPrevMolecule = currentMoleculeIndex > 0;

  const handlePrevCurriculumMolecule = () => {
    if (hasPrevMolecule) {
      setCurrentMoleculeIndex(currentMoleculeIndex - 1);
      setPlacedElectrons([]);
      setActiveTool('dot');
    }
  };

  const handleNextCurriculumMolecule = () => {
    if (hasNextMolecule) {
      setCurrentMoleculeIndex(currentMoleculeIndex + 1);
      setPlacedElectrons([]);
      setActiveTool('dot');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setPlacedElectrons([]);
          setShowHints(false);
        }}
        onResetMolecule={handleClearElectrons}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
        completedCount={completedMolecules.size}
        totalMolecules={MOLECULES.length}
        isHardMode={isHardMode}
        onToggleHardMode={handleToggleHardMode}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-2.5 sm:py-3.5 flex flex-col gap-2.5 sm:gap-3">
        {/* ROUND CLEAR FLOATING BANNER */}
        {roundClearBanner && (
          <div className="bg-emerald-500 text-slate-950 px-3 py-1.5 rounded-lg font-black text-xs sm:text-sm tracking-wide text-center shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-1.5 animate-bounce">
            <Sparkles className="w-4 h-4" />
            <span>{roundClearBanner}</span>
          </div>
        )}

        {/* SUBMISSION FEEDBACK ALERT */}
        {submissionAlert && (
          <div
            className={`px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm tracking-wide shadow-lg flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150 border ${
              submissionAlert.type === 'error'
                ? 'bg-rose-950/90 border-rose-500 text-rose-200 shadow-rose-950/50'
                : submissionAlert.type === 'warning'
                ? 'bg-amber-950/90 border-amber-500 text-amber-200 shadow-amber-950/50'
                : 'bg-emerald-950/90 border-emerald-500 text-emerald-200 shadow-emerald-950/50'
            }`}
          >
            {submissionAlert.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            ) : (
              <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />
            )}
            <span>{submissionAlert.message}</span>
          </div>
        )}

        {/* TAB 1: CURRICULUM MODE OR TAB 2: ENDLESS ARCADE MODE */}
        {(activeTab === 'builder' || activeTab === 'endless') && (
          <div className="flex flex-col gap-2.5 sm:gap-3">
            {/* If in Endless Mode, show the Arcade HUD */}
            {isEndless && (
              <EndlessModeHUD
                state={endlessState}
                onChangeType={handleChangeEndlessType}
                onUseOctetScan={handleUseOctetScan}
                onUseBondSpark={handleUseBondSpark}
                onSkipMolecule={handleSkipEndlessMolecule}
                onRestart={handleRestartEndless}
                sparkAvailable={sparkAvailable}
                scanAvailable={scanAvailable}
                isHardMode={isHardMode}
                onToggleHardMode={handleToggleHardMode}
              />
            )}

            {/* Compound Context & Question Navigation Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-900/70 border border-slate-800/80 rounded-xl px-3.5 py-2 sm:py-2.5 backdrop-blur-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center font-mono font-black text-base sm:text-lg text-cyan-300 shrink-0 shadow-inner">
                  {currentMolecule.formula}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-sm sm:text-base font-bold text-white tracking-tight leading-tight">
                      {currentMolecule.name}
                    </h1>
                    <span
                      className={`text-[11px] font-semibold tracking-wide ${
                        isHardMode ? 'text-rose-400 font-mono' : 'text-cyan-400'
                      }`}
                    >
                      {isHardMode
                        ? '• Ratio: Undisclosed'
                        : `• ${currentMolecule.bondTypeSummary}`}
                    </span>
                    {!isEndless && completedMolecules.has(currentMolecule.id) && (
                      <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-0.5 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                        <ShieldCheck className="w-3 h-3" />
                        Mastered
                      </span>
                    )}
                    {isEndless && (
                      <span className="text-[10px] text-amber-400 font-mono font-bold flex items-center gap-0.5 bg-amber-950/60 border border-amber-500/30 px-1.5 py-0.2 rounded">
                        <Flame className="w-3 h-3" />
                        Wave {endlessState.wave}
                      </span>
                    )}
                    {isHardMode && (
                      <span className="text-[9px] font-mono font-bold uppercase text-rose-400 bg-rose-950/80 border border-rose-500/40 px-1.5 py-0.2 rounded">
                        Exam
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 truncate max-w-xl hidden md:block">
                    {currentMolecule.description}
                  </p>
                </div>
              </div>

              {/* Direct Question Navigation & 3D Link */}
              <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                {!isEndless ? (
                  <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 p-1 rounded-lg">
                    <button
                      onClick={handlePrevCurriculumMolecule}
                      disabled={!hasPrevMolecule}
                      className={`p-1 rounded text-xs flex items-center gap-0.5 transition-colors ${
                        hasPrevMolecule
                          ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                          : 'text-slate-600 cursor-not-allowed'
                      }`}
                      title="Previous Compound"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span className="hidden sm:inline text-[11px]">Prev</span>
                    </button>

                    <select
                      value={currentMoleculeIndex}
                      onChange={(e) => {
                        const idx = parseInt(e.target.value, 10);
                        if (!isNaN(idx)) {
                          setCurrentMoleculeIndex(idx);
                          setPlacedElectrons([]);
                          setActiveTool('dot');
                        }
                      }}
                      className="bg-slate-900 border border-slate-700/80 text-cyan-300 text-xs font-semibold rounded px-2 py-0.5 cursor-pointer hover:border-cyan-500/50 focus:outline-none"
                    >
                      {MOLECULES.map((m, idx) => (
                        <option key={m.id} value={idx}>
                          #{idx + 1}: {m.name} ({m.formula}){completedMolecules.has(m.id) ? ' ✓' : ''}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={handleNextCurriculumMolecule}
                      disabled={!hasNextMolecule}
                      className={`py-1 px-2.5 rounded text-xs font-bold flex items-center gap-1 transition-all ${
                        !hasNextMolecule
                          ? 'text-slate-600 cursor-not-allowed'
                          : feedback.isValid
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/30 animate-pulse'
                          : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-xs'
                      }`}
                      title={hasNextMolecule ? 'Go to Next Compound' : 'Completed all curriculum compounds'}
                    >
                      <span>Next Compound</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleSubmitEndlessAnswer}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer select-none ${
                      isEndless && endlessState.type === 'streak' && isHardMode
                        ? 'bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 shadow-rose-500/20'
                        : 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-amber-500/20'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      {isEndless && endlessState.type === 'streak' && isHardMode
                        ? 'Submit (Exam)'
                        : 'Submit Diagram'}
                    </span>
                  </button>
                )}

                <button
                  onClick={() => setActiveTab('viewer3d')}
                  className="hidden sm:flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-cyan-300 bg-slate-800/60 hover:bg-slate-800 px-2 py-1 rounded border border-slate-700/60 transition-colors"
                  title="View 3D Giant Ionic Lattice"
                >
                  3D Lattice
                </button>
              </div>
            </div>

            {/* Split Interactive Stage: Canvas (Left) + Toolbox & Validation (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-start">
              {/* Left Zone: Molecular Canvas (7 cols on desktop) */}
              <div className="lg:col-span-7 flex flex-col gap-2">
                <MolecularCanvas
                  molecule={currentMolecule}
                  placedElectrons={placedElectrons}
                  activeTool={activeTool}
                  onPlaceElectron={handlePlaceElectron}
                  onRemoveElectron={handleRemoveElectron}
                  onUpdateElectron={handleUpdateElectron}
                  showHints={showHints}
                  isCompleted={feedback.isValid}
                  isHardMode={isHardMode}
                  atomSymbols={feedback.atomSymbols}
                />

                {/* Valence Inventory Bar */}
                {isHardMode ? (
                  <div className="bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-1.5 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-rose-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1 shrink-0">
                        <Flame className="w-3 h-3" /> Exam Mode:
                      </span>
                      <span className="text-slate-300 text-[11px] truncate">
                        Valence numbers hidden. Deduce outer shell electron transfer from group numbers!
                      </span>
                    </div>
                    <div className="text-rose-400 font-mono font-semibold text-[11px] hidden sm:block whitespace-nowrap ml-2">
                      2.0x Score Bonus
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-1.5 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <span className="text-slate-300 font-medium text-[11px]">Transferred:</span>
                      <span className="text-cyan-300 font-mono font-semibold text-xs">
                        ● {feedback.expectedDots} Metal e⁻
                      </span>
                      <span className="text-slate-600">·</span>
                      <span className="text-amber-300 font-mono font-semibold text-xs">
                        ✖ {feedback.expectedCrosses} Non-Metal e⁻
                      </span>
                      <span className="text-[10px] text-slate-500 hidden md:inline">
                        (transfer to octet)
                      </span>
                    </div>
                    <div className="text-slate-400 text-[11px] hidden sm:block">
                      Compound Target: <span className="font-mono text-emerald-400 font-bold">{currentMolecule.formula}</span> (Net Charge: 0)
                    </div>
                  </div>
                )}
              </div>

              {/* Right Zone: Electron Tray & Validation Panel (5 cols on desktop) */}
              <div className="lg:col-span-5 flex flex-col gap-2.5">
                {/* Electron Toolbox */}
                <ElectronTray
                  molecule={currentMolecule}
                  placedElectrons={placedElectrons}
                  activeTool={activeTool}
                  onSelectTool={setActiveTool}
                  showHints={showHints}
                  onToggleHints={() => setShowHints((prev) => !prev)}
                  onClearElectrons={handleClearElectrons}
                  onProvideStepHint={handleProvideStepHint}
                  onAutoSolve={handleAutoSolve}
                  onLoadNeutralAtoms={handleLoadNeutralAtoms}
                  isCompleted={feedback.isValid}
                  isHardMode={isHardMode}
                  atomSymbols={feedback.atomSymbols}
                  expectedDots={feedback.expectedDots}
                  expectedCrosses={feedback.expectedCrosses}
                />

                {/* Outer Shell & Charge Status Card */}
                <ValidationPanel
                  molecule={currentMolecule}
                  feedback={feedback}
                  onNextMolecule={handleNextCurriculumMolecule}
                  hasNextMolecule={hasNextMolecule}
                  onReset={handleClearElectrons}
                  isHardMode={isHardMode}
                  isEndless={isEndless}
                  isSurvivalHardMode={isEndless && endlessState.type === 'streak' && isHardMode}
                  endlessType={endlessState.type}
                  onSubmitAnswer={handleSubmitEndlessAnswer}
                />
              </div>
            </div>

            {/* Compound Curriculum Selector */}
            {!isEndless && (
              <MoleculeSelector
                currentMolecule={currentMolecule}
                onSelectMolecule={handleSelectMolecule}
                completedMolecules={completedMolecules}
              />
            )}
          </div>
        )}

        {/* TAB 3: 3D CRYSTAL LATTICE VIEWER */}
        {activeTab === 'viewer3d' && (
          <div className="flex flex-col gap-6">
            <Molecule3DViewer molecule={currentMolecule} />
            <MoleculeSelector
              currentMolecule={currentMolecule}
              onSelectMolecule={handleSelectMolecule}
              completedMolecules={completedMolecules}
            />
          </div>
        )}

        {/* TAB 4: STEP-BY-STEP BONDING GUIDE */}
        {activeTab === 'guide' && (
          <StepByStepGuide onStartBuilding={() => setActiveTab('builder')} />
        )}

        {/* TAB 5: PERIODIC TABLE VALENCE REFERENCE */}
        {activeTab === 'periodictable' && (
          <PeriodicTableReference />
        )}
      </main>

      {/* Game Over Modal in Endless Mode */}
      {isEndless && endlessState.isGameOver && (
        <GameOverModal
          state={endlessState}
          onPlayAgain={handleRestartEndless}
          onExitToCurriculum={() => setActiveTab('builder')}
        />
      )}

      {/* Subtle Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span>Ionic Bond Lab</span>
            <span className="mx-2 text-slate-700">·</span>
            <span>Interactive Dot and Cross Diagrams & Crystal Lattice Simulation for Chemistry</span>
          </div>
          <div className="text-slate-600">
            Keyboard Shortcuts: [1] Dot · [2] Cross · [3] Eraser · [H] Hints
          </div>
        </div>
      </footer>
    </div>
  );
}
