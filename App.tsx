import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { generatePuzzle } from './services/gemini';
import { PuzzleData, GridState, CellState, Category } from './types';
import { PuzzleGrid } from './components/PuzzleGrid';
import { CluesList } from './components/CluesList';
import { GameControls } from './components/GameControls';
import { Brain, Sparkles, AlertCircle, CheckCircle, Info, Lock } from 'lucide-react';

// Shared helper for key generation to ensure consistency
const getKey = (c1: number, i1: number, c2: number, i2: number) => {
  const part1 = `c${c1}i${i1}`;
  const part2 = `c${c2}i${i2}`;
  return part1 < part2 ? `${part1}|${part2}` : `${part2}|${part1}`;
};

const parseKey = (key: string) => {
  const [p1, p2] = key.split('|');
  const c1 = parseInt(p1.charAt(1));
  const i1 = parseInt(p1.slice(3));
  const c2 = parseInt(p2.charAt(1));
  const i2 = parseInt(p2.slice(3));
  return { c1, i1, c2, i2 };
};

const App: React.FC = () => {
  const [puzzle, setPuzzle] = useState<PuzzleData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [gridState, setGridState] = useState<GridState>({});
  const [themeInput, setThemeInput] = useState<string>("Classic Mystery");
  
  // Game Logic State
  const [tokens, setTokens] = useState<number>(3);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [win, setWin] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success' | 'info', message: string } | null>(null);
  
  // Clue Logic
  const [revealedClues, setRevealedClues] = useState<number>(4);

  const initGame = useCallback(async (theme: string) => {
    setLoading(true);
    setFeedback(null);
    setWin(false);
    setGameOver(false);
    setTokens(3); 
    setRevealedClues(4); // Start with 4 clues
    setGridState({}); 
    try {
      const data = await generatePuzzle(theme);
      setPuzzle(data);
    } catch (err) {
      setFeedback({ type: 'error', message: "Failed to load puzzle. Please check your API key." });
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    initGame("Classic Mystery");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-clear feedback after 5 seconds
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Smart Auto-X Logic
  const recalculateGrid = (currentGrid: GridState): GridState => {
    const nextGrid = { ...currentGrid };
    Object.keys(nextGrid).forEach(k => {
      if (nextGrid[k] === CellState.FALSE_AUTO) {
        delete nextGrid[k];
      }
    });

    Object.entries(nextGrid).forEach(([key, state]) => {
      if (state === CellState.TRUE) {
        const { c1, i1, c2, i2 } = parseKey(key);
        for (let x = 0; x < 4; x++) {
          if (x !== i2) {
            const rowKey = getKey(c1, i1, c2, x);
            if (!nextGrid[rowKey]) nextGrid[rowKey] = CellState.FALSE_AUTO;
          }
          if (x !== i1) {
            const colKey = getKey(c1, x, c2, i2);
            if (!nextGrid[colKey]) nextGrid[colKey] = CellState.FALSE_AUTO;
          }
        }
      }
    });
    return nextGrid;
  };

  const revealSolution = (currentPuzzle: PuzzleData, userGrid: GridState) => {
    const perfectGrid: GridState = {};
    const cats = currentPuzzle.categories;
    const pairs = [[0,1], [0,2], [1,2]]; // Category pairs

    // 1. Build the Perfect Solution Grid
    for (const [cIdxA, cIdxB] of pairs) {
      const itemsA = cats[cIdxA].items;
      for (let iA = 0; iA < itemsA.length; iA++) {
        const itemA = itemsA[iA];
        let matches = currentPuzzle.solution[itemA];
        if (!matches) {
             const keyMatch = Object.keys(currentPuzzle.solution).find(k => k.trim().toLowerCase() === itemA.trim().toLowerCase());
             if (keyMatch) matches = currentPuzzle.solution[keyMatch];
        }
        if (matches) {
          const catBItems = cats[cIdxB].items;
          const itemB = matches.find(m => catBItems.some(cb => cb.trim().toLowerCase() === m.trim().toLowerCase()));
          if (itemB) {
            const iB = cats[cIdxB].items.findIndex(x => x.trim().toLowerCase() === itemB.trim().toLowerCase());
            if (iB !== -1) {
              const key = getKey(cIdxA, iA, cIdxB, iB);
              perfectGrid[key] = CellState.TRUE;
            }
          }
        }
      }
    }

    // 2. Compare User Grid vs Perfect Grid
    const comparisonGrid: GridState = { ...userGrid };

    // Mark Correct (Match) and Incorrect (User TRUE, Perfect FALSE)
    for (const [key, val] of Object.entries(userGrid)) {
        if (val === CellState.TRUE) {
            if (perfectGrid[key] === CellState.TRUE) {
                comparisonGrid[key] = CellState.TRUE_CORRECT;
            } else {
                comparisonGrid[key] = CellState.TRUE_INCORRECT;
            }
        }
    }

    // Mark Missed (Perfect TRUE, User !TRUE)
    for (const [key, val] of Object.entries(perfectGrid)) {
        if (val === CellState.TRUE) {
            if (userGrid[key] !== CellState.TRUE) {
                comparisonGrid[key] = CellState.MISSED;
            }
        }
    }

    setGridState(comparisonGrid);
  };

  const handleCellClick = (c1: number, i1: number, c2: number, i2: number, isRightClick?: boolean) => {
    if (win || gameOver) return;
    const key = getKey(c1, i1, c2, i2);
    const currentState = gridState[key] || CellState.EMPTY;
    
    let nextManualState = CellState.EMPTY;
    if (isRightClick) {
      nextManualState = (currentState === CellState.EMPTY || currentState === CellState.FALSE_AUTO || currentState === CellState.TRUE) 
        ? CellState.FALSE 
        : CellState.EMPTY;
    } else {
      if (currentState === CellState.EMPTY || currentState === CellState.FALSE_AUTO) {
        nextManualState = CellState.TRUE;
      } else if (currentState === CellState.TRUE) {
        nextManualState = CellState.FALSE;
      } else {
        nextManualState = CellState.EMPTY;
      }
    }
    const tempGrid = { ...gridState };
    if (nextManualState === CellState.EMPTY) {
      delete tempGrid[key];
    } else {
      tempGrid[key] = nextManualState;
    }
    const finalGrid = recalculateGrid(tempGrid);
    setGridState(finalGrid);
  };

  const checkSolution = () => {
    if (!puzzle || gameOver || win) return;

    if (tokens <= 0) {
      setFeedback({ type: 'error', message: "No tokens left!" });
      return;
    }
    
    const nextTokens = tokens - 1;
    setTokens(nextTokens);

    let isCorrect = true;
    let userTrueCount = 0;
    
    for (const [key, state] of Object.entries(gridState)) {
      if (state === CellState.TRUE) {
        userTrueCount++;
        const { c1, i1, c2, i2 } = parseKey(key);
        const item1Name = puzzle.categories[c1].items[i1];
        const item2Name = puzzle.categories[c2].items[i2];

        let matches: string[] | undefined;
        if (puzzle.solution[item1Name]) {
            matches = puzzle.solution[item1Name];
        } else {
            const keyMatch = Object.keys(puzzle.solution).find(k => k.trim().toLowerCase() === item1Name.trim().toLowerCase());
            if (keyMatch) matches = puzzle.solution[keyMatch];
        }
        
        const isMatch = matches?.some(m => m.trim().toLowerCase() === item2Name.trim().toLowerCase());
        if (!matches || !isMatch) isCorrect = false;
      }
    }

    const isComplete = userTrueCount === 12;

    if (isCorrect && isComplete) {
      setWin(true);
      setFeedback({ type: 'success', message: "Perfect! You solved the puzzle!" });
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    } else {
      if (!isCorrect) {
        setFeedback({ type: 'error', message: "Incorrect. Some checks are wrong." });
      } else {
        setFeedback({ type: 'info', message: "Correct so far, but incomplete." });
      }

      if (nextTokens === 0) {
        setGameOver(true);
        setFeedback({ type: 'error', message: "Out of tokens! Solution revealed." });
        revealSolution(puzzle, gridState);
      }
    }
  };

  const giveHint = () => {
    if (!puzzle || win || gameOver) return;
    
    if (tokens <= 0) {
      setFeedback({ type: 'error', message: "No tokens left!" });
      return;
    }
    
    if (revealedClues >= puzzle.clues.length) {
       setFeedback({ type: 'info', message: "All clues are already revealed!" });
       return;
    }

    const nextTokens = tokens - 1;
    setTokens(nextTokens);
    setRevealedClues(prev => prev + 1);
    setFeedback({ type: 'success', message: "New clue revealed!" });
    
    if (nextTokens === 0) {
       setGameOver(true);
       // Pass the CURRENT grid state (before this render update) effectively
       // Since giveHint doesn't modify gridState, we can pass gridState safely
       setTimeout(() => {
           setFeedback({ type: 'error', message: "Out of tokens! Solution revealed." });
           revealSolution(puzzle, gridState);
       }, 1500); 
    }
  };

  return (
    <div className="min-h-screen bg-[#fdf6e3] flex flex-col items-center py-8 px-4 sm:px-6 font-sans text-[#2b2d42]">
      
      {/* Header */}
      <div className="w-full max-w-7xl mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-[#2b2d42] p-3 rounded-lg shadow-lg">
            <Brain className="w-8 h-8 text-[#edf2f4]" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-[#2b2d42] tracking-wide font-serif">LOGIC GRID <span className="text-[#d90429]">MYSTERY</span></h1>
            <p className="text-[#8d99ae] font-medium tracking-widest text-xs uppercase">Generated Deductive Reasoning</p>
          </div>
        </div>
        
        {puzzle && (
           <div className="bg-[#fff] px-6 py-4 rounded-sm border border-[#d4c5b0] shadow-sm max-w-2xl flex-1 md:text-right relative">
             <div className="absolute top-0 left-0 w-full h-1 bg-[#2b2d42] opacity-10"></div>
             <h2 className="text-xl font-bold font-serif text-[#2b2d42]">{puzzle.title}</h2>
             <p className="text-sm text-[#5e6472] mt-1 italic font-serif leading-relaxed">"{puzzle.story}"</p>
           </div>
        )}
      </div>

      <div className="w-full max-w-7xl">
        <GameControls 
          onNewGame={() => initGame(themeInput)} 
          onCheck={checkSolution}
          onHint={giveHint}
          loading={loading}
          theme={themeInput}
          setTheme={setThemeInput}
          tokens={tokens}
          gameOver={gameOver || win}
          revealedClues={revealedClues}
          totalClues={puzzle ? puzzle.clues.length : 8}
        />

        {/* Feedback Banner */}
        {feedback && (
          <div className={`
            mb-6 border-l-4 px-6 py-4 rounded-r-md flex items-center gap-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300 font-serif
            ${feedback.type === 'error' ? 'bg-[#fff0f3] border-[#d90429] text-[#800f2f]' : ''}
            ${feedback.type === 'success' ? 'bg-[#f0fff4] border-[#38b000] text-[#004b23]' : ''}
            ${feedback.type === 'info' ? 'bg-[#e0fbfc] border-[#00b4d8] text-[#0077b6]' : ''}
          `}>
            {feedback.type === 'error' && <AlertCircle className="w-6 h-6 shrink-0" />}
            {feedback.type === 'success' && <CheckCircle className="w-6 h-6 shrink-0" />}
            {feedback.type === 'info' && <Info className="w-6 h-6 shrink-0" />}
            <span className="font-bold text-lg">{feedback.message}</span>
          </div>
        )}

        {/* Game Over Banner */}
        {gameOver && !win && (
          <div className="mb-6 bg-[#2b2d42] text-white px-6 py-4 rounded-sm shadow-xl flex items-center gap-4 animate-in fade-in border-4 border-[#1a1b26]">
             <Lock className="w-8 h-8 text-[#d90429]" />
             <div>
               <p className="font-bold text-xl font-serif tracking-wide text-[#edf2f4]">CASE CLOSED</p>
               <p className="text-[#8d99ae] text-sm">You ran out of resources. The solution comparison is shown below.</p>
             </div>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-32 animate-pulse">
            <Sparkles className="w-16 h-16 text-[#2b2d42] mb-6 animate-spin-slow" />
            <p className="text-2xl font-bold text-[#2b2d42] font-serif">Constructing Mystery...</p>
            <p className="text-[#8d99ae] mt-2 font-serif italic">Interviewing witnesses, gathering evidence...</p>
          </div>
        )}

        {!loading && puzzle && (
          <div className="flex flex-col xl:flex-row gap-12 items-start justify-center">
            
            {/* Left Column: Grid */}
            <div className="w-full xl:w-auto overflow-visible pb-8 flex flex-col items-center">
              <div className={`min-w-fit transition-all duration-700 ${gameOver ? 'opacity-100' : ''}`}>
                 <PuzzleGrid 
                  categories={puzzle.categories} 
                  gridState={gridState} 
                  onCellClick={handleCellClick}
                  disabled={gameOver || win}
                 />
                 {/* Legend for Game Over */}
                 {gameOver && !win && (
                    <div className="mt-4 flex gap-4 text-xs font-bold font-serif uppercase tracking-widest text-[#2b2d42] bg-white/50 px-4 py-2 rounded-sm">
                      <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-gradient-to-br from-[#4a7c59] to-[#2d4a3e]"></div> Correct</div>
                      <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-gradient-to-br from-[#e63946] to-[#9d0208]"></div> Incorrect</div>
                      <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-gradient-to-br from-[#457b9d] to-[#1d3557]"></div> Missed</div>
                    </div>
                 )}
              </div>
            </div>

            {/* Right Column: Clues */}
            <div className="w-full xl:flex-1 h-[650px] xl:h-[750px]">
              <CluesList clues={puzzle.clues} revealedCount={revealedClues} />
            </div>

          </div>
        )}
      </div>
      
    </div>
  );
};

export default App;