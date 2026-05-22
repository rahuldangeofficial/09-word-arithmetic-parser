/**
 * @fileoverview English Word Arithmetic Tokenizer
 *
 * Converts a raw arithmetic expression string written with English operator words
 * into an ordered array of typed tokens. The tokenizer handles:
 *
 *   • Decimal numbers (only one decimal point allowed per number)
 *   • English operator words (plus, minus, multiply, divide) case-insensitively
 *   • Parentheses for grouping
 *   • Arbitrary whitespace between tokens
 *   • Expressions with no whitespace between tokens (e.g. "1plus2")
 *
 * Each token records its type, value, and character position in the original
 * input for detailed error reporting.
 *
 * @module tokenizer
 */

import { OPERATORS, TOKEN_TYPES, getOperatorKeywords } from './grammar.js';

// ─────────────────────────────────────────────────────────────
//  Token Data Structure
// ─────────────────────────────────────────────────────────────

/**
 * @typedef {Object} Token
 * @property {string}        type     - One of the TOKEN_TYPES values.
 * @property {string|number} value    - The token's semantic value:
 *   - For NUMBER tokens: the parsed numeric value (a JS number).
 *   - For OPERATOR tokens: the normalized lowercase operator word.
 *   - For LPAREN / RPAREN: the literal '(' or ')'.
 * @property {number}        position - Zero-based index of the token's
 *   first character in the original input string.
 */

// ─────────────────────────────────────────────────────────────
//  Tokenizer Class
// ─────────────────────────────────────────────────────────────

/**
 * Breaks an arithmetic expression into a flat array of tokens.
 *
 * The tokenizer employs a single left-to-right pass over the input.
 * At each position it attempts to match (in priority order):
 *
 *   1. Whitespace: consumed and discarded.
 *   2. A digit or decimal point: begins a number literal.
 *   3. An opening or closing parenthesis.
 *   4. An English operator keyword (case-insensitive): checked longest-first
 *      to avoid partial matches.
 *
 * If none of the above match, a descriptive error is thrown indicating
 * the character and its position.
 *
 * @example
 * const tokenizer = new Tokenizer('10 plus 2');
 * const tokens = tokenizer.tokenize();
 * // → [
 * //   { type: 'NUMBER',   value: 10,     position: 0 },
 * //   { type: 'OPERATOR', value: 'plus', position: 3 },
 * //   { type: 'NUMBER',   value: 2,      position: 8 },
 * // ]
 */
export class Tokenizer {
  /**
   * Creates a new Tokenizer for the given input string.
   *
   * @param {string} input - The raw arithmetic expression.
   * @throws {TypeError} If input is not a string.
   */
  constructor(input) {
    if (typeof input !== 'string') {
      throw new TypeError(
        `Tokenizer expected a string input, received ${typeof input}.`
      );
    }

    /** @type {string} The original, unmodified input. */
    this.input = input;

    /**
     * The current scan position (zero-based character index).
     * @type {number}
     * @private
     */
    this._pos = 0;

    /**
     * Pre-sorted operator keywords (longest first) fetched once
     * at construction time so we don't re-sort on every token.
     * @type {string[]}
     * @private
     */
    this._keywords = getOperatorKeywords();
  }

  // ───────────────────────────────────────────────────────────
  //  Public API
  // ───────────────────────────────────────────────────────────

  /**
   * Tokenizes the entire input and returns the resulting token array.
   *
   * @returns {Token[]} An ordered array of tokens.
   * @throws {SyntaxError} If an unrecognized character is encountered.
   */
  tokenize() {
    /** @type {Token[]} */
    const tokens = [];

    while (this._pos < this.input.length) {
      // ── 1. Skip whitespace ──────────────────────────────
      if (this._isWhitespace(this.input[this._pos])) {
        this._pos++;
        continue;
      }

      // ── 2. Number literal ──────────────────────────────
      if (this._isDigitOrDot(this.input[this._pos])) {
        tokens.push(this._readNumber());
        continue;
      }

      // ── 3. Parentheses ─────────────────────────────────
      if (this.input[this._pos] === '(') {
        tokens.push({
          type: TOKEN_TYPES.LPAREN,
          value: '(',
          position: this._pos,
        });
        this._pos++;
        continue;
      }

      if (this.input[this._pos] === ')') {
        tokens.push({
          type: TOKEN_TYPES.RPAREN,
          value: ')',
          position: this._pos,
        });
        this._pos++;
        continue;
      }

      // ── 4. English operator keywords (case-insensitive) ──
      const operatorToken = this._tryReadOperator();
      if (operatorToken) {
        tokens.push(operatorToken);
        continue;
      }

      // ── 5. Unrecognized character ──────────────────────
      const char = this.input[this._pos];
      throw new SyntaxError(
        `Unrecognized character '${char}' at position ${this._pos} ` +
        `in expression: "${this.input}"`
      );
    }

    return tokens;
  }

  // ───────────────────────────────────────────────────────────
  //  Private Helpers
  // ───────────────────────────────────────────────────────────

  /**
   * Reads a decimal number starting at the current position.
   *
   * Scans consecutive digit and dot characters. Only the first dot is
   * treated as a decimal separator; a second dot terminates the number.
   *
   * @returns {Token} A NUMBER token with the parsed float as its value.
   * @throws {SyntaxError} If the consumed characters don't form a valid number.
   * @private
   */
  _readNumber() {
    const start = this._pos;
    let dotFound = false;

    while (this._pos < this.input.length) {
      const char = this.input[this._pos];

      if (char === '.') {
        if (dotFound) {
          // A second dot means this number is finished; the dot belongs
          // to whatever comes next (or is an error the parser will catch).
          break;
        }
        dotFound = true;
        this._pos++;
      } else if (this._isDigit(char)) {
        this._pos++;
      } else {
        break;
      }
    }

    const raw = this.input.slice(start, this._pos);
    const value = parseFloat(raw);

    if (Number.isNaN(value)) {
      throw new SyntaxError(
        `Invalid number "${raw}" at position ${start} ` +
        `in expression: "${this.input}"`
      );
    }

    return { type: TOKEN_TYPES.NUMBER, value, position: start };
  }

  /**
   * Attempts to match an English operator keyword at the current position.
   *
   * Keywords are tried longest-first so that a shorter keyword that is a
   * prefix of a longer one never shadows the longer keyword.
   *
   * @returns {Token|null} An OPERATOR token if a keyword matches, else null.
   * @private
   */
  _tryReadOperator() {
    const remaining = this.input.slice(this._pos).toLowerCase();

    for (const keyword of this._keywords) {
      if (remaining.startsWith(keyword)) {
        const token = {
          type: TOKEN_TYPES.OPERATOR,
          value: keyword, // Normalizes token value to lowercase
          position: this._pos,
        };
        this._pos += keyword.length;
        return token;
      }
    }

    return null;
  }

  /**
   * Checks whether a character is ASCII whitespace.
   * @param {string} ch - A single character.
   * @returns {boolean}
   * @private
   */
  _isWhitespace(ch) {
    return ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r';
  }

  /**
   * Checks whether a character is an ASCII digit (0-9).
   * @param {string} ch - A single character.
   * @returns {boolean}
   * @private
   */
  _isDigit(ch) {
    return ch >= '0' && ch <= '9';
  }

  /**
   * Checks whether a character is a digit or a decimal dot.
   * @param {string} ch - A single character.
   * @returns {boolean}
   * @private
   */
  _isDigitOrDot(ch) {
    return this._isDigit(ch) || ch === '.';
  }
}
