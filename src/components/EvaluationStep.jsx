import React, { useState, useEffect } from 'react';
import { Play, Pause, ChevronRight, ChevronLeft, RotateCcw, CheckCircle2, PlayCircle, Circle } from 'lucide-react';
import { ArithmeticParser } from '../parser/ArithmeticParser.js';

export default function EvaluationStep({ input, onActiveNodeChange }) {
  const [steps, setSteps] = useState([]);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!input) {
      setSteps([]);
      setCurrentStepIdx(0);
      setError(null);
      return;
    }

    try {
      const parser = new ArithmeticParser(input);
      parser.parse();
      const generatedSteps = parser.getSteps();
      setSteps(generatedSteps);
      setCurrentStepIdx(0);
      setError(null);
      
      // Notify parent of the first active node
      if (generatedSteps.length > 0 && onActiveNodeChange) {
        onActiveNodeChange(generatedSteps[0].nodeId);
      } else if (onActiveNodeChange) {
        onActiveNodeChange(null);
      }
    } catch (e) {
      setError(e.message);
      setSteps([]);
      setCurrentStepIdx(0);
      if (onActiveNodeChange) onActiveNodeChange(null);
    }
  }, [input]);

  // Stepping timer
  useEffect(() => {
    let timer = null;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentStepIdx(prev => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          const nextIdx = prev + 1;
          if (onActiveNodeChange && steps[nextIdx]) {
            onActiveNodeChange(steps[nextIdx].nodeId);
          }
          return nextIdx;
        });
      }, 1500); // slightly slower for reading explanations
    }
    return () => clearInterval(timer);
  }, [isPlaying, steps, onActiveNodeChange]);

  const handleNext = () => {
    if (currentStepIdx < steps.length - 1) {
      const nextIdx = currentStepIdx + 1;
      setCurrentStepIdx(nextIdx);
      if (onActiveNodeChange && steps[nextIdx]) {
        onActiveNodeChange(steps[nextIdx].nodeId);
      }
    }
  };

  const handlePrev = () => {
    if (currentStepIdx > 0) {
      const prevIdx = currentStepIdx - 1;
      setCurrentStepIdx(prevIdx);
      if (onActiveNodeChange && steps[prevIdx]) {
        onActiveNodeChange(steps[prevIdx].nodeId);
      }
    }
  };

  const handleReset = () => {
    setCurrentStepIdx(0);
    setIsPlaying(false);
    if (onActiveNodeChange && steps[0]) {
      onActiveNodeChange(steps[0].nodeId);
    }
  };

  if (error) {
    return (
      <div className="error-card">
        <p className="error-text">Cannot evaluate: {error}</p>
      </div>
    );
  }

  if (!input || steps.length === 0) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
        Enter a word arithmetic expression above to run the step-by-step BODMAS evaluator.
      </div>
    );
  }

  const currentStep = steps[currentStepIdx] || { operation: '', result: 0, nodeId: null };

  // Generate BODMAS explanation
  const getExplanation = (op) => {
    if (op.includes('(') || op.includes(')')) {
      return 'Brackets have the absolute highest priority. We evaluate the expression inside the brackets before applying outside operations.';
    }
    if (op.includes('×') || op.includes('÷')) {
      return 'According to BODMAS, Division and Multiplication bind more tightly than addition/subtraction. We perform this high-priority calculation next.';
    }
    return 'Addition and Subtraction have lowest priority and equal precedence. We evaluate this sub-expression from left to right.';
  };

  const progressPct = ((currentStepIdx + 1) / steps.length) * 100;

  return (
    <div className="evaluator-visualizer">
      {/* 1. Progress Header */}
      <div className="stepper-header">
        <span className="stepper-progress">
          Step {currentStepIdx + 1} of {steps.length}
        </span>
        <div className="stepper-progress-bar">
          <div className="stepper-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="tokenizer-controls-row">
          <button className="control-btn-sm" onClick={handlePrev} disabled={currentStepIdx === 0} title="Previous step">
            <ChevronLeft size={14} />
          </button>
          <button className="control-btn-sm" onClick={() => setIsPlaying(!isPlaying)} disabled={steps.length <= 1} title={isPlaying ? 'Pause' : 'Auto-play'}>
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button className="control-btn-sm" onClick={handleNext} disabled={currentStepIdx === steps.length - 1} title="Next step">
            <ChevronRight size={14} />
          </button>
          <button className="control-btn-sm" onClick={handleReset} title="Reset">
            <RotateCcw size={12} />
          </button>
        </div>
      </div>

      {/* 2. Active Operation Card */}
      <div className={`step-card-active ${currentStepIdx === steps.length - 1 ? 'complete' : ''}`}>
        <div className="step-row-top">
          <span className={`step-num-badge ${currentStepIdx === steps.length - 1 ? 'complete' : ''}`}>
            {currentStepIdx === steps.length - 1 ? 'Final Reduction' : `Evaluation Step ${currentStepIdx + 1}`}
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Active Node: {currentStep.nodeId}
          </span>
        </div>

        <div className="step-operation-math">
          {currentStep.operation} = <span style={{ color: 'var(--secondary-light)' }}>{currentStep.result}</span>
        </div>

        <div className="step-explanation">
          <div style={{ fontWeight: '700', fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
            BODMAS Explanation
          </div>
          {getExplanation(currentStep.operation)}
        </div>
      </div>

      {/* 3. Steps Checklist */}
      <div>
        <p className="preset-title" style={{ fontSize: '0.78rem', marginBottom: '8px' }}>
          Evaluation Trace Checklist
        </p>
        <div className="steps-collapsed-list">
          {steps.map((step, idx) => {
            const isActive = idx === currentStepIdx;
            const isCompleted = idx < currentStepIdx;
            
            let statusClass = '';
            if (isActive) statusClass = 'active';
            if (isCompleted) statusClass = 'completed';

            return (
              <div key={idx} className={`step-small-row ${statusClass}`}>
                <div style={{ marginRight: '10px', display: 'flex', alignItems: 'center' }}>
                  {isCompleted ? (
                    <CheckCircle2 size={14} style={{ color: 'var(--secondary-light)' }} />
                  ) : isActive ? (
                    <PlayCircle size={14} style={{ color: 'var(--primary-start)', animation: 'pulse 1.5s infinite' }} />
                  ) : (
                    <Circle size={14} style={{ color: 'var(--text-muted)' }} />
                  )}
                </div>
                <div style={{ marginRight: '10px', fontWeight: '700', color: isActive ? 'var(--primary-start)' : 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
                  STEP-{String(idx + 1).padStart(2, '0')}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', textDecoration: isCompleted ? 'line-through' : 'none', color: isCompleted ? 'var(--text-muted)' : isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  {step.operation}
                </div>
                <div className="step-small-result" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: isCompleted ? 'var(--text-muted)' : isActive ? 'var(--secondary-light)' : 'var(--token-number)' }}>
                  {step.result}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
