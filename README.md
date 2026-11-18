# Campus Stores · Product Engineer Work Sample

Standalone campus media equipment desk prototype with **Guided Partial Return and Structured Handover**.

## Overview

This repository contains the completed Product Engineer practical for **Virinchi Healthcare**. The application simulates an operational shift at a campus media equipment desk, handling pickup, a partial equipment return, structured handover between operators, and morning shift closure.

---

## The Product Problem & The Solution

### 1. What the Existing Product Handles Well
- **Traceable Physical-Unit Loan Slips:** Every asset receives its own discrete slip (e.g., `L-401`, `L-402`, `L-403`). By avoiding treating multi-piece kits as opaque, indivisible bundles, the desk maintains granular inventory tracking by serial/bin and keeps maintenance logs independent.
- **Request Boundaries & Safe Validation:** The desk validates requests against approved Student Activities Office forms, preventing operators from issuing unapproved types, exceeding approved limits, or releasing items flagged for repair.

### 2. Operational Weakness Identified in the Starter Product
- **Fragmented Multi-Piece Returns:** When Kabir Sen returns only the projector and speaker while leaving the adapter with Leela Das, the operator was forced to close slips individually and manually type an unstructured note into the Desk Book.
- **High Morning Cognitive Load & Ambiguity:** On Saturday morning at 9:00 am, the incoming operator was forced to read through free-text notes, deduce which of multiple adapters was outstanding (`AD-12` vs `AD-15`), search the loan register, and manually connect Leela Das with Kabir's original Friday loan.

### 3. The Guided Partial Return & Handover Improvement
- **Guided Multi-Unit Return Desk:** Allows returning units grouped under an approved request in a single workflow.
- **Physical Verification Checklist:** The operator checks off only items physically in hand (`PR-04`, `SP-02`).
- **Custodian & Expected Return Tracking:** Outstanding items (`AD-12`) automatically trigger custodian capture (`Leela Das`) and expected drop-off scheduling (`Saturday · 9:00 am`).
- **Automated Structured Handover:** Generates an unambiguous, slip-linked handover card directly in the Desk Book.
- **Morning Shift Resolution Alert:** Greets the incoming operator with an Operational Priority alert and provides direct receipt confirmation and closure for `AD-12`.

### 4. Measurable Real-World Counter Observations
To evaluate the impact of this improvement at a real campus equipment desk:
1. **Counter Resolution Time:** Measure the time (in seconds) required for an incoming morning operator from when a drop-off borrower arrives at the counter to physical verification and loan closure.
2. **Clarification Interruption Rate:** Track the count of morning shifts requiring phone calls or chat messages to the prior shift operator to clarify missing items.

---

## Running the Application

Open `index.html` directly in any modern browser, or run a local HTTP server:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Then visit `http://localhost:8000`.

---

## Verifying the End-to-End Shift Scenario

1. **Friday · 3:45 pm (Pickup):**
   - Click **Restart sample shift** to initialize baseline data.
   - Go to **Loan register** → click **New issue slip**.
   - Issue `PR-04` (Projector) to `Kabir Sen` for `RQ-214`.
   - Issue `SP-02` (Speaker) to `Kabir Sen` for `RQ-214`.
   - Issue `AD-12` (Adapter) to `Kabir Sen` for `RQ-214`.
   - In **Inventory**, observe all three items are marked `ON LOAN`.

2. **Friday · 7:30 pm (Partial Return):**
   - In the Shift banner, click **Move to return time**.
   - Open **Loan register** or **Requests** (`RQ-214`) and click **Guided return**.
   - Check `PR-04` and `SP-02` (physically returned). Leave `AD-12` unchecked.
   - Custodian automatically defaults to `Leela Das` with expected return `Saturday · 9:00 am`.
   - Click **Confirm Return & Record Handover**.
   - In **Inventory**, `PR-04` and `SP-02` are back `ON SHELF`, while `AD-12` remains `ON LOAN` / `PARTIALLY RETURNED`.
   - In **Desk book**, inspect the auto-generated structured handover record.

3. **Saturday · 9:00 am (Morning Shift Closure):**
   - In the Shift banner, click **Move to next morning**.
   - The top **Operational Pulse** highlights the incoming priority: *Verify and close outstanding loan for AD-12 with Leela Das.*
   - In **Loan register**, slip `L-404` (`AD-12`) is highlighted with `RETURN EXPECTED`.
   - Click **Close slip**, confirm physical receipt and asset inspection.
   - All 3 items are now confirmed `ON SHELF`, and all loan slips retain their complete historical audit trails.

---

## Technical Stack & Architecture

- **Runtime:** Pure HTML5, CSS3, and Vanilla JavaScript (ES6+).
- **Persistence:** Browser `localStorage` with versioned migration (`campus-stores.shift.v2`).
- **Accessibility:** High-contrast tags with distinct shapes and text badges (never relying solely on color), full keyboard navigation, and semantic HTML5 landmarks.
- **Dependencies:** Zero external frameworks, zero Node.js/npm dependencies, 100% offline capable.
