/**
 * @fileoverview English Word Arithmetic Grammar Definitions
 *
 * This module defines the complete grammar for parsing arithmetic expressions
 * written with English operator words. It maps operator keywords to their
 * mathematical symbols, types, precedence levels, and evaluation functions.
 *
 * Precedence levels follow BODMAS rules:
 *   - Level 2 (higher): Multiplication (multiply) and Division (divide)
 *   - Level 1 (lower):  Addition (plus) and Subtraction (minus)
 *
 * Brackets are handled structurally by the parser, not via precedence.
 *
 * @module grammar
 */

// ─────────────────────────────────────────────────────────────
//  Operator Definitions
// ─────────────────────────────────────────────────────────────

/**
 * @typedef {Object} OperatorMetadata
 * @property {string}   symbol     - The mathematical symbol (e.g. '+', '-', '×', '÷').
 * @property {string}   type       - A human-readable operator type label.
 * @property {number}   precedence - Operator precedence (higher binds tighter).
 * @property {function(number, number): number} evaluate
 *   A pure function that applies the operator to two numeric operands.
 */

/**
 * Maps each English operator keyword to its metadata.
 *
 * | English      | Symbol | Type           | Precedence |
 * |--------------|--------|----------------|------------|
 * | plus         | +      | ADDITION       | 1          |
 * | minus        | -      | SUBTRACTION    | 1          |
 * | multiply     | ×      | MULTIPLICATION | 2          |
 * | divide       | ÷      | DIVISION       | 2          |
 *
 * @type {Object.<string, OperatorMetadata>}
 */
export const OPERATORS = {
  'plus': {
    symbol: '+',
    type: 'ADDITION',
    precedence: 1,
    evaluate: (a, b) => a + b,
  },
  'minus': {
    symbol: '-',
    type: 'SUBTRACTION',
    precedence: 1,
    evaluate: (a, b) => a - b,
  },
  'multiply': {
    symbol: '×',
    type: 'MULTIPLICATION',
    precedence: 2,
    evaluate: (a, b) => a * b,
  },
  'divide': {
    symbol: '÷',
    type: 'DIVISION',
    precedence: 2,
    evaluate: (a, b) => a / b,
  },
};

// ─────────────────────────────────────────────────────────────
//  Token Types
// ─────────────────────────────────────────────────────────────

/**
 * Enum-like object representing the possible token categories produced
 * by the tokenizer. These are used downstream by the parser to drive
 * its recursive-descent logic.
 *
 * @readonly
 * @enum {string}
 */
export const TOKEN_TYPES = Object.freeze({
  /** A numeric literal (integer or decimal). */
  NUMBER: 'NUMBER',

  /** An English word arithmetic operator keyword. */
  OPERATOR: 'OPERATOR',

  /** A left / opening parenthesis '('. */
  LPAREN: 'LPAREN',

  /** A right / closing parenthesis ')'. */
  RPAREN: 'RPAREN',
});

// ─────────────────────────────────────────────────────────────
//  Helper Functions
// ─────────────────────────────────────────────────────────────

/**
 * Returns an array of operator keywords sorted by length in
 * **descending** order. This ordering is critical for the tokenizer:
 * it ensures that longer keywords are matched first so that a shorter
 * keyword that happens to be a prefix of a longer one doesn't consume
 * the input prematurely.
 *
 * @returns {string[]} Operator keywords, longest first.
 *
 * @example
 * getOperatorKeywords();
 * // → ['multiply', 'divide', 'minus', 'plus']
 */
export function getOperatorKeywords() {
  return Object.keys(OPERATORS).sort((a, b) => b.length - a.length);
}
