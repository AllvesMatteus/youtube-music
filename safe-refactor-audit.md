# PROJECT DEEP SAFE AUDIT — FULL CODEBASE SIMPLIFICATION, CLEANUP & ARCHITECTURE OPTIMIZATION

Analyze this entire codebase deeply as a senior software architect, refactoring specialist, runtime safety engineer, performance optimizer, and framework expert.

Your goal is NOT to add features.

Your goal is to:

- simplify the codebase
- remove unnecessary complexity
- reduce boilerplate
- improve maintainability
- improve readability
- improve scalability
- improve performance
- improve architecture

WITHOUT breaking functionality.

This is a SAFE refactor audit.

Never assume something is removable just because it looks unused.

Always validate dependencies, side effects, execution flow, framework lifecycle, and hidden references first.

---

# CORE RULE

Before suggesting removal, replacement, merge, simplification, or optimization:

You MUST verify:

1. Is it directly used?
2. Is it indirectly used?
3. Is it dynamically referenced?
4. Is it framework lifecycle dependent?
5. Is it dependency-injected?
6. Is it required by reflection?
7. Is it used by routing?
8. Is it used by event listeners?
9. Is it used by async callbacks?
10. Is it used by external APIs/services?
11. Is it used in future execution paths?
12. Is it required for hydration?
13. Is it required for rendering order?
14. Is it required for state consistency?
15. Is it required by build/runtime tooling?
16. Is it conditionally executed?
17. Is it used through props/context/store?

If uncertain:

mark as:

POSSIBLY USED — DO NOT REMOVE

Never guess.

---

# PRIMARY OBJECTIVE

Reduce:

- dead code
- duplicated logic
- duplicated variables
- duplicated styles
- unnecessary abstractions
- unnecessary files
- unnecessary dependencies
- unnecessary comments
- unnecessary states
- unnecessary wrappers
- unnecessary custom helpers

Preserve:

- business logic
- behavior
- output
- rendering
- side effects
- async flow
- framework lifecycle
- compatibility
- API contracts

---

# FULL ANALYSIS

## 1. SAFE DEAD CODE DETECTION

Detect:

- unused imports
- unused variables
- unused constants
- unused hooks
- unused states
- unused refs
- unused props
- unused functions
- unused classes
- unused files
- unused assets
- unused styles
- unused routes
- unreachable code
- duplicated conditions

Validate before removing:

- dynamic imports
- lazy loading
- event bindings
- route references
- framework registration
- build tools
- config injection
- environment-based execution

Classify:

SAFE REMOVE  
RISKY REMOVE  
POSSIBLY USED

---

## 2. VARIABLE AUDIT

Analyze all variables.

Find:

- duplicated variables
- redundant state
- derived values that should not be state
- unnecessary refs
- unnecessary memoization
- repeated object declarations
- over-engineered structures
- props drilling opportunities

Validate:

- render dependency
- effect dependency
- async dependency
- closure dependency
- state mutation dependency

Classify:

KEEP  
REMOVE  
MERGE  
DERIVE

Include risk level.

---

## 3. FUNCTION AUDIT

Analyze every function.

Detect:

- overly complex functions
- repeated logic
- duplicate helpers
- deeply nested conditions
- unnecessary wrappers
- helper over-abstraction
- custom implementations of native behavior

Validate before changing:

- callback chains
- async chains
- debounce/throttle
- retries
- API dependencies
- event bindings
- external references

Classify:

ESSENTIAL  
SIMPLIFIABLE  
REPLACEABLE  
REMOVABLE  
RISKY

Include risk level.

---

## 4. FRAMEWORK NATIVE REPLACEMENT AUDIT

Check if custom code can be replaced by native framework features.

Examples:

React:
- useMemo
- useCallback
- useReducer
- Context
- lazy
- Suspense
- ErrorBoundary

Next.js:
- Image
- Link
- Metadata API
- Server Actions
- Route Handlers

Vue:
- computed
- watch
- composables

Tailwind:
- utility extraction
- repeated class pattern reduction

Node:
- fs
- path
- url
- crypto

JavaScript:
- map
- reduce
- filter
- find
- flatMap
- Set
- WeakMap
- Object.entries
- Promise.all
- AbortController

Only recommend replacement if behavior remains identical.

Validate:

- lifecycle
- hydration
- SSR
- edge cases
- async compatibility

---

## 5. COMPONENT AUDIT

Analyze:

- giant components
- repeated structures
- repeated UI blocks
- unnecessary wrappers
- over-splitting
- under-splitting
- poor composition

Detect:

- reusable patterns
- extractable components
- merge opportunities
- simplification opportunities

Validate:

- props flow
- state isolation
- memoization
- render order
- context dependency

Classify:

KEEP  
MERGE  
SPLIT  
REMOVE

---

## 6. STATE MANAGEMENT AUDIT

Analyze:

- duplicated state
- unnecessary local state
- unnecessary global state
- derived state
- race conditions
- stale closures
- effect abuse
- overuse of useEffect

Classify:

CORRECT  
SIMPLIFIABLE  
OVER-ENGINEERED  
UNDER-ENGINEERED

---

## 7. EFFECTS AUDIT

Analyze:

- useEffect
- watchers
- subscriptions
- intervals
- observers
- listeners

Validate:

- dependency arrays
- cleanup
- stale closures
- hidden mutations
- memory leaks
- render loops

High priority.

---

## 8. PERFORMANCE AUDIT

Find:

- unnecessary re-renders
- expensive loops
- repeated calculations
- duplicated fetches
- memory leaks
- layout thrashing
- excessive listeners
- expensive DOM queries
- large reactivity chains
- unoptimized animations

Suggest:

simpler + safer optimizations.

---

## 9. CSS / STYLING AUDIT

Analyze:

- duplicated styles
- conflicting styles
- unused styles
- repeated utility chains
- unnecessary custom CSS
- excessive specificity
- bloated responsive rules

Validate:

- dynamic classes
- conditional classes
- JS-injected classes

Suggest:

MERGE  
REMOVE  
SIMPLIFY  
EXTRACT

---

## 10. DEPENDENCY AUDIT

Analyze all dependencies.

Find:

- unused packages
- overlapping packages
- heavy packages for small tasks
- packages replaceable by native APIs

Validate:

- peer dependency reliance
- plugin usage
- build tooling
- CLI usage
- transitive usage

Classify:

KEEP  
SAFE REMOVE  
REPLACE

---

## 11. COMMENT CLEANUP AUDIT

Analyze all comments.

Remove:

- obvious comments
- redundant comments
- AI-generated comments
- placeholder comments
- temporary comments
- outdated comments
- dead commented code
- TODOs without context
- duplicated explanations
- noisy section separators

Examples:

// initialize variable  
// loop through items  
// fetch data  
// click handler  
// set state  
// render component

Keep only comments that explain:

- complex business logic
- edge cases
- framework limitations
- performance hacks
- security logic
- compatibility workarounds
- technical debt intentionally kept
- important warnings

Rule:

Prefer self-explanatory code over comments.

If a comment exists because naming is bad:

improve naming first.

Classify:

KEEP  
REMOVE  
REWRITE

---

## 12. FILE STRUCTURE AUDIT

Analyze:

- oversized files
- mixed responsibilities
- bad folder structure
- duplicated modules
- bad file naming
- unnecessary fragmentation

Recommend:

better organization
better naming
better separation

Do not over-split.

---

## 13. NAMING AUDIT

Find:

- vague names
- generic names
- misleading names
- inconsistent names
- poor semantic naming

Improve:

- variables
- functions
- files
- components
- hooks
- classes

Use names based on real purpose.

---

# RISK ENGINE

Every suggestion must include:

LOW RISK  
MEDIUM RISK  
HIGH RISK

Definitions:

LOW = isolated and safe

MEDIUM = affects multiple areas

HIGH = affects lifecycle, rendering, async flow, architecture, or shared state

---

# CHANGE ORDER

Refactor in this exact order:

1. Dead imports
2. Dead variables
3. Dead comments
4. Dead styles
5. Duplicate helpers
6. Native replacements
7. File cleanup
8. Component cleanup
9. State simplification
10. Effect cleanup
11. Dependency removal

Never invert this order.

---

# OUTPUT FORMAT

## PROJECT HEALTH SCORE

Rate from 0–100.

---

## SAFE REMOVALS

Only guaranteed safe removals.

---

## POSSIBLE REMOVALS

Need manual validation.

---

## HIGH RISK AREAS

List everything.

---

## VARIABLE REPORT

KEEP / REMOVE / MERGE / DERIVE

with risk level.

---

## FUNCTION REPORT

ESSENTIAL / SIMPLIFIABLE / REPLACEABLE / REMOVABLE

with risk level.

---

## COMMENT REPORT

KEEP / REMOVE / REWRITE

---

## NATIVE FRAMEWORK REPLACEMENTS

What can be replaced.

---

## COMPONENT IMPROVEMENTS

What to merge/split/remove.

---

## FILE STRUCTURE IMPROVEMENTS

New proposed structure.

---

## PERFORMANCE IMPROVEMENTS

Ordered by safest first.

---

## DEPENDENCY CLEANUP

Safe uninstall list.

---

## FINAL SAFE REFACTOR PLAN

Step-by-step.

Ordered from lowest risk to highest risk.

---

FINAL RULES:

Do NOT rewrite the entire project immediately.

Audit first.

Explain first.

Always prefer:

- simpler over clever
- native over custom
- cleaner over verbose
- fewer files over fragmented abstractions
- maintainability over micro-optimization
- stability over aggressive cleanup

If unsure:

DO NOT REMOVE.

Mark it.

Explain it.

Correctness > optimization.