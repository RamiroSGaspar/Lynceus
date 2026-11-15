# Guided demo

[Español](../es/demo.md) · [Home](../../README.md)

**The entire walkthrough uses simulated data.** This presents the prototype;
it is not a medical procedure.

## Preparation

Run `pnpm dev` from the root and open the address printed in the terminal.
The team's local session may use http://127.0.0.1:5178/; a new installation normally
uses http://localhost:5173/. Keep the same address and browser to retain controls:
changing port, host or browser profile changes the storage.

Choose **English**, **flight day 150** and **Elena Voss (B)**.
The assistant is optional for this presentation.

## Short walkthrough

| Step | Action | What to explain |
|---|---|---|
| 1. Start | Start Elena's control | Each eye is compared with its own pre-flight exam |
| 2. Tests | Skip symptoms, acuity and Amsler for the short version | They are recorded as not done; visitor responses are not invented |
| 3. Right eye | Capture and wait | The instrument generates 48 scans and the engine measures their pixels; choose “Continue” |
| 4. Left eye | Capture | A scripted blink causes the first attempt to fail; no measurement is presented |
| 5. Retry | Choose to repeat, then press “Capture” again | The second attempt is accepted; continue to the result |
| 6. Result | Read summary, range, level and next steps | A first sign means a threshold was crossed, not a diagnosis |
| 7. History | Open “See the history” | Earlier points come from the simulated dataset; the new control is distinguished |
| 8. Report | Return to the result and prepare the medical conference | Add a question and download the report as text |

Under these conditions, the rounded observations on 15 November 2026 were
**+31 µm in the right eye (range +22 to +40)** and **+23 µm in the left eye
(+13 to +33)**. These are measured changes in fictional images. Ranges come from
the provisional model, not clinically validated error margins.

Different symptom or Amsler responses can change the session level. Computer load
affects capture time; wait for completion rather than a fixed countdown.

## Optional extensions

- **Viewer:** open it from an accepted capture or the result, choose a scan and
  show boundaries and the pre-flight comparison. Its profile chart plots position
  within the scan, not time.
- **Assistant:** read the consent notice and outgoing summary, then ask
  “What does my result mean for my right eye?” A key and connection are required.
  If it is unavailable, local measurement and the report still work.

“How it works” shows the evaluation summary and why the fitted model was not
activated. “What is known about the brain” separates established information from
what cannot be known on board.

## Repeat the presentation

Opening a completed control offers its result or a repeat. Completing the repeat
replaces that saved control. During a session there is also a restart action.

For a clean presentation, the start screen can delete saved data after confirmation;
this removes local controls and questions. Deletion is unnecessary to inspect the
included history.

## Presentation check

This flow was checked with vision tests skipped, rejection and retry, result,
history, report download and key text in both languages. The validation explanation
was also checked in English and Spanish. Physical printing and a real-provider
AI response were not part of that check. A local link works while its server runs.
