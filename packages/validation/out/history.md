# Crew history measured by the engine

> Simulated data. Not a medical device. Not validated on people. Every exam below is fictional, produced by the virtual instrument and measured
> by the analysis engine. This is the generation of the history that comes with the application, not a validation:
> the error model is still the provisional one and no uncertainty was estimated here.

## Versions and artifact

| Item | Value |
|---|---|
| File | `packages/core/src/dataset/measured-history.json` (measured-history-1) |
| Engine | 0.1.0 |
| Rules | rules-1.1.0 |
| Error model | provisional-1 (provisional) |
| Instrument | virtual, no version of its own; exam format HSF-OCT-103, scan format HSF-BS-103 |
| Vision scenarios | provisional-history-1 (fictional, not read from a tomography) |
| Attempts per eye and session | up to 3, stopping at the first one the engine accepts |
| Size | 312781 bytes (305.5 KiB) |
| SHA-256 | eff36a4c4d766848c6c52bfc742e27d5d31eb3211c64875075e5a979e6e3cc79 |
| Sessions / exams analysed | 27 sessions / 57 captures |
| Cache | none: every capture was generated and analysed in this run |

## Controls per crew member

| Crew | Flight days | Controls | Refused captures | Level on the last control |
|---|---|---|---|---|
| A | 0, 30, 90, 150 | 3 in flight | 1 | no-detectable-change |
| B | 0, 30, 90, 118, 150, 178 | 5 in flight | 1 | first-sign |
| C | 0, 30, 58, 90, 118, 139, 150, 171 | 7 in flight | 1 | clinically-concerning |
| D | 0, 30, 51, 72, 90, 111, 132, 150, 171 | 8 in flight | 0 | clinically-concerning |

## Sessions

| Crew | Day | Level | Change of the 0–250 µm ring OD / OS (µm) | Next control (reason) | OD | OS |
|---|---|---|---|---|---|---|
| A | 0 | no-detectable-change | — / — | day 30 (routine) | measured in attempt 1 | measured in attempt 1 |
| A | 30 | no-detectable-change | +5.9 / +4.2 | day 90 (routine) | measured in attempt 2 (refused #1: too-few-usable-scans + bmo-fit-failed + truncated + motion) | measured in attempt 1 |
| A | 90 | no-detectable-change | +8.2 / +5.2 | day 150 (routine) | measured in attempt 1 | measured in attempt 1 |
| A | 150 | no-detectable-change | +8.9 / +6.2 | none, the mission ends | measured in attempt 1 | measured in attempt 1 |
| B | 0 | no-detectable-change | — / — | day 30 (routine) | measured in attempt 1 | measured in attempt 1 |
| B | 30 | no-detectable-change | +14.8 / +10.2 | day 90 (routine) | measured in attempt 1 | measured in attempt 1 |
| B | 90 | first-sign | +23.9 / +17.1 | day 118 (first-sign) | measured in attempt 1 | measured in attempt 1 |
| B | 118 | first-sign | +26.6 / +20.1 | day 150 (first-sign) | measured in attempt 1 | measured in attempt 1 |
| B | 150 | first-sign | +31.0 / +23.0 | day 178 (first-sign) | measured in attempt 1 | measured in attempt 2 (refused #1: too-few-usable-scans + insufficient-ring-coverage + signal-dropout + bmo-not-found) |
| B | 178 | first-sign | +31.7 / +24.1 | none, the mission ends | measured in attempt 1 | measured in attempt 1 |
| C | 0 | no-detectable-change | — / — | day 30 (routine) | measured in attempt 1 | measured in attempt 1 |
| C | 30 | first-sign | +26.9 / +14.9 | day 58 (first-sign) | measured in attempt 1 | measured in attempt 1 |
| C | 58 | first-sign | +37.4 / +20.6 | day 90 (first-sign) | measured in attempt 1 | measured in attempt 1 |
| C | 90 | first-sign | +48.0 / +27.1 | day 118 (first-sign) | measured in attempt 2 (refused #1: too-few-usable-scans + bmo-fit-failed + low-signal + signal-dropout + bmo-not-found + surface-not-found) | measured in attempt 1 |
| C | 118 | clinically-concerning | +57.5 / +32.8 | day 139 (clinically-concerning) | measured in attempt 1 | measured in attempt 1 |
| C | 139 | clinically-concerning | +63.9 / +36.8 | day 150 (clinically-concerning) | measured in attempt 1 | measured in attempt 1 |
| C | 150 | clinically-concerning | +66.4 / +38.1 | day 171 (clinically-concerning) | measured in attempt 1 | measured in attempt 1 |
| C | 171 | clinically-concerning | +68.0 / +39.0 | none, the mission ends | measured in attempt 1 | measured in attempt 1 |
| D | 0 | no-detectable-change | — / — | day 30 (routine) | measured in attempt 1 | measured in attempt 1 |
| D | 30 | clinically-concerning | +118.3 / +110.1 | day 51 (clinically-concerning) | measured in attempt 1 | measured in attempt 1 |
| D | 51 | clinically-concerning | +162.7 / +169.5 | day 72 (clinically-concerning) | measured in attempt 1 | measured in attempt 1 |
| D | 72 | clinically-concerning | +191.1 / +201.4 | day 90 (clinically-concerning) | measured in attempt 1 | measured in attempt 1 |
| D | 90 | clinically-concerning | +202.7 / +214.7 | day 111 (clinically-concerning) | measured in attempt 1 | measured in attempt 1 |
| D | 111 | clinically-concerning | +195.8 / +221.2 | day 132 (clinically-concerning) | measured in attempt 1 | measured in attempt 1 |
| D | 132 | clinically-concerning | +182.9 / +215.5 | day 150 (clinically-concerning) | measured in attempt 1 | measured in attempt 1 |
| D | 150 | clinically-concerning | +168.6 / +200.4 | day 171 (clinically-concerning) | measured in attempt 1 | measured in attempt 1 |
| D | 171 | clinically-concerning | +147.8 / +183.3 | none, the mission ends | measured in attempt 1 | measured in attempt 1 |

## Timing (the only part of this file that changes between runs)

Computed in 151 s with 2 worker(s): A 44 s, B 63 s, C 82 s, D 88 s.
