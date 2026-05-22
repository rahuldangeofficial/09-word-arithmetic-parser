/**
 * @fileoverview Word Arithmetic Parser - Usage Examples
 *
 * Demonstrates the ArithmeticParser with all 7 canonical test cases.
 * Run this file via:
 *   • Opening examples.html in a browser (results appear in the console)
 *   • Node.js ≥ 14 (with ES module support)
 *
 * @module examples
 */

import { ArithmeticParser } from '../src/parser/ArithmeticParser.js';

// ─────────────────────────────────────────────────────────────
//  Test Cases
// ─────────────────────────────────────────────────────────────

/**
 * Each entry: [expression, expectedResult, description]
 */
const TEST_CASES = [
  [
    '10 plus 2 multiply 3 minus 4 divide 2',
    14,
    '10 + 2 × 3 - 4 ÷ 2  (BODMAS: multiply & divide first)',
  ],
  [
    '10.5 plus 2 multiply (3 minus 4) divide 2.5',
    9.7,
    '10.5 + 2 × (3 - 4) ÷ 2.5  (decimals + brackets)',
  ],
  [
    '10.5plus2multiply(3minus4)divide2.5',
    9.7,
    'Same as above but without any whitespace',
  ],
  [
    '16 minus 8 plus 14 divide 2',
    15,
    '16 - 8 + 14 ÷ 2  (left-to-right at same precedence)',
  ],
  [
    '16 minus (8 plus 14) divide 2',
    5,
    '16 - (8 + 14) ÷ 2  (brackets override precedence)',
  ],
  [
    '16.5plus2.5multiply(3minus4)divide2.5',
    15.5,
    '16.5 + 2.5 × (3 - 4) ÷ 2.5  (decimals, no whitespace)',
  ],
  [
    '1plus2plus3',
    6,
    '1 + 2 + 3  (chained addition, no whitespace)',
  ],
];

// ─────────────────────────────────────────────────────────────
//  Run Examples
// ─────────────────────────────────────────────────────────────

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║              Word Arithmetic Parser - Examples               ║');
console.log('╚══════════════════════════════════════════════════════════════╝');
console.log('');

let allPassed = true;

TEST_CASES.forEach(([expression, expected, description], index) => {
  const label = `Test ${index + 1}`;

  console.log(`┌─ ${label}: ${description}`);
  console.log(`│  Input:    "${expression}"`);

  try {
    const parser = new ArithmeticParser(expression);
    const result = parser.parse();
    const tokens = parser.getTokens();
    const steps  = parser.getSteps();

    const passed = result === expected;
    const status = passed ? 'PASS' : 'FAIL';

    if (!passed) allPassed = false;

    console.log(`│  Tokens:   ${tokens.map(t => t.value).join('  ')}`);

    if (steps.length > 0) {
      console.log('│  Steps:');
      steps.forEach((step, i) => {
        console.log(`│    ${i + 1}. ${step.operation} = ${step.result}`);
      });
    }

    console.log(`│  Result:   ${result}`);
    console.log(`│  Expected: ${expected}`);
    console.log(`└─ ${status}`);
  } catch (error) {
    allPassed = false;
    console.log(`│  Error:    ${error.message}`);
    console.log(`└─ ERROR`);
  }

  console.log('');
});

// ─────────────────────────────────────────────────────────────
//  Summary
// ─────────────────────────────────────────────────────────────

if (allPassed) {
  console.log('All tests passed!');
} else {
  console.log('Some tests failed. Review the output above.');
}
