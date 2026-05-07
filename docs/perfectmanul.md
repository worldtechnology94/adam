# Perfect STE benchmark manual (fiction)

**Purpose:** Controlled **ASD-STE100-style** maintenance text for **benchmarking ADAM** (longer multi-section manual: scope, safety, tools, five tasks, return to service, related documents, records). This is **not** an official ASD certification. Convert this file to PDF when you want to test extraction plus analysis.

**How this text was written (to minimize false alarms in ADAM)**

- **Words:** General-service STE vocabulary (imperative procedures, approved-dictionary patterns). No Latin abbreviations (no *e.g.*, *i.e.*, *etc.*). **US spelling** (e.g. *color* if used, not *colour*).
- **Punctuation:** **No semicolons.** Use **ASCII hyphen** `-` only (no en dash `–` or em dash `—`, which can trigger STE-8.7). Use **straight** apostrophes and quotes in your PDF tool.
- **Lists:** Use a **serial comma** before *and* / *or* in lists of three or more items (STE-8.2 heuristic in ADAM).
- **Procedures:** **Imperative** steps; **the** before nouns in commands (e.g. *Open the valve*, not *Open valve*). Prefer **Do not** over contractions.
- **Safety:** ADAM’s STE-7.1 engine expects **`WARNING:`** in capitals. Do **not** use `CAUTION:` or `DANGER:` as sentence starters (they are flagged until you align product rules with your chosen STE issue).
- **References:** Use explicit labels such as **Section 3** and **Figure 2** (capital *S* / *F* where ADAM checks STE-9.x).
- **Length:** Instructional lines are kept **short** (typical STE guidance: about **20 words** per instructional sentence; ADAM uses a verb-first heuristic for “instructional” vs “descriptive”).

Rename this file to `perfectmanual.md` if you prefer standard spelling.

---

## Document body (copy from here for a pure-text PDF)

HYDRAULIC SYSTEM MAINTENANCE MANUAL

Name: Hydraulic system maintenance

Number: 1

Date: 01 MAR 2025

---

### 1. Scope

The following steps apply to the hydraulic system in the equipment.

The procedures in this manual are for trained maintenance personnel only.

The manual gives instructions for fluid service, filter replacement, line inspection, and depressurization.

You need the applicable equipment manual for system limits and operational data.

See Section 10 for a list of related documents.

---

### 2. Safety

WARNING: Fluid can burn you.

WARNING: Do not remove a cap if the fluid is not cool.

WARNING: Pressurized fluid can cause injury.

WARNING: Do not disconnect a line before you depressurize the system.

WARNING: Do not smoke near the fluid.

WARNING: Use only the fluid that the applicable manual identifies.

---

### 3. Tools and materials

1. Get a clean container for used fluid.

2. Get a standard tool set for the bolts in this procedure.

3. Get clean material to wipe surfaces.

4. Get serviceable hydraulic fluid before you start fluid service.

5. Get the serviceable filter before you start the filter replacement task.

---

### 4. Task 1 - Check hydraulic fluid level

Use the steps in this task to check the hydraulic fluid level in the system.

1. Make sure that the system is not pressurized.

2. Remove the access cover.

3. Check the fluid level in the pump.

4. If the level is below the minimum mark, do this:

   a. Get serviceable hydraulic fluid. Use only the fluid that the applicable manual identifies.

   b. Remove the cap.

   c. Add fluid until the level is between the minimum mark and the maximum mark.

   d. Install the cap.

   e. Install the access cover.

5. If the level is not below the minimum mark, install the access cover.

6. Make sure that you install the access cover correctly.

7. Wipe spilled fluid from the equipment.

See Figure 2 for the location of the pump.

See the applicable manual for torque data for the access cover bolts.

---

### 5. Task 2 - Replace the hydraulic filter

Read this information before you start Task 2. Contamination can occur if the work area is not clean.

1. Make sure that the system is not pressurized.

2. Open the access cover.

3. Put a clean container below the filter.

4. Disconnect the line at the filter.

5. Remove the used filter.

6. Inspect the filter head for damage.

7. If you find damage, get a serviceable filter head before you continue.

8. Install the serviceable filter.

9. Connect the line to the filter.

10. Make sure that the torque is correct.

11. Make sure that the connection does not leak.

12. Install the access cover.

13. Make sure that you install the access cover correctly.

See Figure 3 for the filter installation.

See the applicable manual for torque data.

---

### 6. Task 3 - Inspect hydraulic lines for leaks

1. Make sure that the system is not pressurized.

2. Inspect each line from the pump to the connection.

3. Look for leaks at each connection.

4. Look for damage to each line.

5. If you find a leak, repair the connection before you pressurize the system.

6. If you find damage, replace the line before you pressurize the system.

7. Wipe each connection with clean material.

8. Make sure that the work area is clean before you continue.

See Figure 4 for the line routing.

---

### 7. Task 4 - Depressurize the hydraulic system

1. Move the control to the OFF position.

2. Open the valve slowly to depressurize the system.

3. Make sure that the pressure is zero.

4. Close the valve.

5. Make sure that the system remains not pressurized before you open a line.

See Figure 5 for the valve location.

---

### 8. Task 5 - Bleed air from the system after service

1. Make sure that the torque is correct at each connection.

2. Follow the applicable manual to pressurize the system.

3. Open the bleed valve slowly.

4. Close the bleed valve when the fluid flow is continuous.

5. Check the fluid level again.

6. Add fluid if the level is below the minimum mark.

7. Install the access cover.

8. Make sure that you install the access cover correctly.

See Section 4 for the fluid level procedure.

---

### 9. Return the equipment to service

1. Remove all tools from the work area.

2. Remove all loose material from the work area.

3. Make sure that you install all access covers correctly.

4. Make sure that the system does not leak.

5. Operate the system within the limits in the applicable manual.

---

### 10. Related documents

See Table 1 for related documents.

Table 1 - Related documents

Row 1. Equipment maintenance manual - operational limits.

Row 2. Electrical system data - interface.

Row 3. Parts list - part numbers for lines and filters.

---

### 11. Record of applicable data

The maintenance record must show the date of the work.

The maintenance record must show the name of this manual.

See Section 1 for the identification data.

---

## What you should still expect

- **Technical names** (part numbers, company names) are **not** in this sample. If you add them, add them to your **custom word list** or expect STE-1.1 noise.
- **POS heuristics** can still misfire on rare lines; triage any remaining STE-1.1 on **declarative** sentences.
- A **perfect score** in the product is not guaranteed: the checker is heuristic. This file is **as clean as practical** for regression against your pipeline.
