# Accuracy of the measurement engine on simulated exams

> Simulated data. Not a medical device. Not validated on people. Every exam below is fictional, produced by the virtual instrument;
> the error is the engine against the known truth of the virtual eye, not a validation on people.

Engine 0.1.0. Specification 01, test 6: normal captures (conditions drawn from each attempt's seed),
the 8 eyes on days 0, 30, 90 and 150. Day 0 is a second pre-flight capture compared with the reference one
(true change 0). A capture the engine refused was repeated, as the application does; the refusals are listed.

## Summary

| Criterion | Required | Result |
|---|---|---|
| Change of the 0–250 µm ring: cases with error ≤ 6 µm | ≥ 95 % | 32 of 32 (100 %) |
| Change of the 0–250 µm ring: largest error | ≤ 10 µm | 0.7 µm |
| Change of the 0–250 µm ring: mean error / RMS | — | +0.10 µm / 0.24 µm |
| Change of roughness: largest error | ≤ 1.5 µm | 0.36 µm |

## All cases

| Eye | Day | Attempt | True change (µm) | Measured (µm) | Error (µm) | True Δ roughness (µm) | Measured (µm) | Error (µm) | MRW true / measured (µm) | Opening area change (%) | Quality (dB) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| A OD | 0 | 2 | +0.0 | +0.0 | +0.0 | +0.00 | -0.14 | -0.14 | 295 / 298 | -0.28 | 27.3 |
| A OD | 30 | 2 | +6.0 | +5.9 | -0.1 | +0.00 | -0.16 | -0.16 | 309 / 313 | -0.09 | 25.8 |
| A OD | 90 | 1 | +8.0 | +8.2 | +0.2 | +0.00 | +0.19 | +0.19 | 314 / 318 | +0.19 | 25.1 |
| A OD | 150 | 1 | +9.0 | +8.9 | -0.1 | +0.00 | -0.12 | -0.12 | 316 / 320 | +0.09 | 24.1 |
| A OS | 0 | 2 | +0.0 | +0.4 | +0.4 | +0.00 | -0.16 | -0.16 | 290 / 292 | +0.13 | 22.3 |
| A OS | 30 | 1 | +4.0 | +4.2 | +0.2 | +0.00 | -0.11 | -0.11 | 299 / 301 | -0.05 | 25.3 |
| A OS | 90 | 1 | +5.0 | +5.2 | +0.2 | +0.00 | -0.03 | -0.03 | 301 / 303 | -0.16 | 21.8 |
| A OS | 150 | 1 | +6.0 | +6.2 | +0.2 | +0.00 | -0.19 | -0.19 | 303 / 306 | +0.04 | 26.3 |
| B OD | 0 | 2 | +0.0 | -0.1 | -0.1 | +0.00 | -0.17 | -0.17 | 372 / 374 | +0.60 | 26.7 |
| B OD | 30 | 1 | +15.0 | +14.8 | -0.2 | +0.00 | -0.20 | -0.20 | 402 / 402 | +0.16 | 24.2 |
| B OD | 90 | 1 | +24.0 | +23.9 | -0.1 | +0.00 | +0.05 | +0.05 | 419 / 419 | +0.38 | 24.1 |
| B OD | 150 | 1 | +31.0 | +31.0 | -0.0 | +0.00 | -0.17 | -0.17 | 433 / 433 | +0.25 | 27.1 |
| B OS | 0 | 2 | +0.0 | +0.1 | +0.1 | +0.00 | -0.24 | -0.24 | 364 / 367 | +0.16 | 26.3 |
| B OS | 30 | 1 | +10.0 | +10.2 | +0.2 | +0.00 | -0.23 | -0.23 | 384 / 388 | +0.21 | 26.0 |
| B OS | 90 | 1 | +17.0 | +17.1 | +0.1 | +0.00 | -0.26 | -0.26 | 398 / 400 | +0.16 | 23.4 |
| B OS | 150 | 2 | +23.0 | +23.0 | +0.0 | +0.00 | +0.05 | +0.05 | 410 / 414 | +0.23 | 23.7 |
| C OD | 0 | 2 | +0.0 | -0.1 | -0.1 | +0.00 | +0.19 | +0.19 | 398 / 398 | +0.08 | 23.7 |
| C OD | 30 | 1 | +27.0 | +26.9 | -0.1 | +0.00 | -0.01 | -0.01 | 446 / 448 | +0.09 | 24.0 |
| C OD | 90 | 2 | +48.0 | +48.0 | +0.0 | +3.80 | +3.75 | -0.05 | 478 / 477 | +0.17 | 22.5 |
| C OD | 150 | 1 | +66.0 | +66.4 | +0.4 | +7.00 | +6.89 | -0.11 | 496 / 497 | -0.18 | 26.9 |
| C OS | 0 | 2 | +0.0 | +0.1 | +0.1 | +0.00 | -0.05 | -0.05 | 386 / 391 | -0.22 | 26.7 |
| C OS | 30 | 1 | +15.0 | +14.9 | -0.1 | +0.00 | +0.36 | +0.36 | 414 / 418 | -0.05 | 24.6 |
| C OS | 90 | 1 | +27.0 | +27.1 | +0.1 | +3.10 | +2.89 | -0.21 | 435 / 440 | +0.02 | 25.1 |
| C OS | 150 | 1 | +38.0 | +38.1 | +0.1 | +4.60 | +4.29 | -0.31 | 452 / 456 | -0.19 | 24.0 |
| D OD | 0 | 2 | +0.0 | +0.1 | +0.1 | +0.00 | -0.00 | -0.00 | 381 / 382 | -0.32 | 28.2 |
| D OD | 30 | 1 | +118.0 | +118.3 | +0.3 | +4.00 | +4.10 | +0.10 | 519 / 521 | -0.16 | 23.6 |
| D OD | 90 | 1 | +203.0 | +202.7 | -0.3 | +10.50 | +10.42 | -0.08 | 567 / 568 | +0.02 | 22.7 |
| D OD | 150 | 1 | +168.0 | +168.6 | +0.6 | +12.40 | +12.23 | -0.17 | 545 / 546 | -0.39 | 24.4 |
| D OS | 0 | 2 | +0.0 | +0.0 | +0.0 | +0.00 | +0.16 | +0.16 | 377 / 382 | +0.28 | 23.3 |
| D OS | 30 | 1 | +110.0 | +110.1 | +0.1 | +3.60 | +3.51 | -0.09 | 519 / 522 | +0.03 | 25.1 |
| D OS | 90 | 1 | +214.0 | +214.7 | +0.7 | +11.60 | +11.58 | -0.02 | 583 / 586 | +0.33 | 24.5 |
| D OS | 150 | 1 | +200.0 | +200.4 | +0.4 | +13.40 | +13.37 | -0.03 | 574 / 577 | +0.14 | 23.3 |

## Refused captures that were repeated

- A OD, day 30: attempt 1: too-few-usable-scans, bmo-fit-failed
- B OS, day 150: attempt 1: too-few-usable-scans, insufficient-ring-coverage
- C OD, day 90: attempt 1: too-few-usable-scans, bmo-fit-failed

Computed in 88 s.
