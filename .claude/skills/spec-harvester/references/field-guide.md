# What to look for, by product class

## Amplifiers

Priority order — the first three are what system design actually depends on:

1. **Power per channel at each impedance.** Look for a table with 8Ω / 4Ω / 2.7Ω / 2Ω columns. Marketing pages give one headline number; datasheets give the table. Always prefer the table.
2. **Minimum load impedance.** Decides how many speakers can parallel onto one channel. A 2Ω-rated amp carries twice the speakers of a 4Ω one — this single field changes system cost.
3. **Channel count.** Sometimes in the model name (`IPX10:4` = 10kW, 4 channels; `PLM20K44` = 20kW, 4 in 4 out), but confirm against the spec table rather than trusting the name.

Then: bridge mode power, 70/100V direct drive, DSP presence, network protocol (Dante/AES67/OMNEO/AVB), rack U, weight, PSU type.

**Sanity check as you go:** power should *rise* as impedance *falls*, until the amp's limit. If your extracted 2Ω figure is lower than 4Ω, either the amp genuinely derates there (some do, and it's worth a note) or you misread a column. Go back and look.

Watch for footnotes on measurement conditions — burst vs. continuous, 1% vs 0.1% THD. Two amps aren't comparable across different conditions. Record the condition in `notes` when stated.

## Speakers

1. **Dispersion H × V.** Drives coverage prediction. Usually "nominal dispersion 90° x 60°". Subs are omnidirectional — record 360.
2. **Sensitivity + its reference.** `dB @ 1W/1m` or `dB @ 2.83V/1m`. Identical at 8Ω, 3 dB apart at 4Ω. If the datasheet doesn't say which, note the ambiguity rather than assuming.
3. **Max SPL** — note whether peak or continuous.
4. **Power handling** (AES/RMS/program — they differ by ~3dB steps) and **nominal impedance**.

Then: frequency response, crossover point, driver complement, connectors, rigging points, weight, IP rating.

A caution: the word "woofer" appears in driver descriptions of full-range boxes ("8-inch woofer + 1-inch driver"). That doesn't make the box a subwoofer. Classify by the product's stated role, not by keyword matching, or you'll end up with a main flagged omnidirectional.

## Processors / DSP

Input × output count is the headline. Then: sample rate, network protocol, control software, AES/analog I/O mix, latency if published.

## Lighting fixtures

1. **Beam/field angle**, and zoom range if it zooms.
2. **Output** — lumens, or lux at a stated distance. Record which one, and the distance; "8000 lumens" and "2400 lux @ 5m" are not interchangeable.
3. **DMX channel modes** — capture every mode, since the chosen mode determines universe capacity.
4. **Power draw** — needed for breaker planning, and it's the field most often missing from marketing pages.

Then: light source (LED type/wattage), CRI/CCT, IP rating, weight, pan/tilt range, dimming curves.

## Cross-cutting

**Model naming.** Manufacturers are inconsistent (`IPX 10:4`, `IPX10:4`, `IPX-10-4`). Record the model name as printed on the datasheet, and put alternates in `notes`. Downstream matching is usually fuzzy, so the canonical form matters less than being consistent within a harvest.

**Series-level vs model-level specs.** A series page may list specs that only apply to some models. When a value comes from a series page rather than the model's own page, it's `verified: false` with a note — series pages are where most wrong data comes from.

**Legacy/discontinued models.** Worth capturing; installed base still needs servicing. Note the status if the page says so.
