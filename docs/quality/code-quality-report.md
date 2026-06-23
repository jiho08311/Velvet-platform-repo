# Velvet Code Quality Report

Generated at: 2026-06-23T00:53:18.854Z

Overall score: **81/100**

Strict hardening debt score: **100/100**. This stricter score treats every boundary and DB-access finding as launch-hardening debt, so it is intentionally harsher than the overall quality score.

## Category Scores

| category | value |
| --- | --- |
| overall | 81 |
| architecture | 92 |
| dbLayer | 82 |
| maintainability | 86 |
| testing | 70 |
| securityReadiness | 76 |
| msaReadiness | 84 |
| operationsReadiness | 63 |


## Summary

| metric | value |
| --- | --- |
| filesScanned | 1672 |
| codeFiles | 1636 |
| testFiles | 36 |
| totalLoc | 100171 |
| totalImports | 3986 |
| totalAny | 0 |
| totalTodo | 0 |
| totalConsole | 0 |
| largeFiles | 0 |
| highImportFiles | 0 |
| boundaryFindings | 0 |
| appRuntimeFindings | 0 |
| crossRepoFindings | 0 |
| publicInternalFindings | 0 |
| directDbFindings | 0 |
| routeAuthFindings | 0 |


## Highest Priority Findings

1. App/workflow -> module runtime imports: 0
2. Cross-module repository imports: 0
3. Direct DB access outside approved DB layers: 0
4. API routes without obvious auth guard: 0
5. Large files over 300 LOC: 0

## App/Workflow Runtime Imports

_None found._


## Cross-Module Repository Imports

_None found._


## Direct DB Access Outside Approved Layers

_None found._


## API Routes Without Obvious Auth Guard

_None found._


## Large Files

_None found._


## High Import Files

_None found._


## Any Usage Hotspots

_None found._


## Notes

- This report is a static analysis aid, not a full correctness proof.
- Route auth findings are heuristic. Public routes may be expected, and some protected routes may use indirect guards.
- Direct DB access findings are intentionally strict to highlight places that may need repository extraction.
- Cross-module repository findings are the strongest MSA-readiness blockers.
