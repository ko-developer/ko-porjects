# Output format

One JSON file per harvest. Import-ready, and readable by a human scanning for gaps.

```json
{
  "brand": "XTA / MC²",
  "series": "Delta / DPA / DNA",
  "source_url": "https://xta.co.uk/portfolio/delta-dpa-dna-legacy/",
  "harvested": "2026-08-04",
  "models": [
    {
      "model": "DPA 80",
      "class": "amp",
      "channels": 4,
      "min_ohm": 2,
      "power": { "8": 1000, "4": 2000, "2.7": 2200, "2": 2000 },
      "bridge": { "8": 4000, "4": 4000 },
      "direct_drive": { "70": 200, "100": 200 },
      "dsp": true,
      "network": "Dante / AES67",
      "rack_u": 2,
      "weight_kg": 15.0,
      "url": "https://xta.co.uk/portfolio/delta-dpa-dna-legacy/",
      "pdf": "https://.../datasheet.pdf",
      "verified": true,
      "notes": ""
    }
  ]
}
```

## Field notes

`power` / `bridge` / `direct_drive` are keyed by load — impedance in ohms for the first two, volts for direct drive. Include only rows the source actually states. Omitting a key is meaningful (that mode isn't offered or isn't published); a wrong guess is not.

`verified: true` means **every populated field came from the manufacturer's own page or PDF**. If any populated field was inferred, it's `false` and `notes` says which one and why.

`notes` is where uncertainty lives. Good notes: `"2Ω figure not published; min impedance inferred from protection spec"`. Useless notes: `"see datasheet"`.

## Speaker entries

Same envelope, different fields:

```json
{
  "model": "F81",
  "class": "speaker",
  "dispersion_h": 90,
  "dispersion_v": 70,
  "sensitivity_db": 98,
  "sensitivity_ref": "2.83V",
  "max_spl": 121,
  "power_aes": 100,
  "impedance": 8,
  "connectors": "2× NL4",
  "verified": true
}
```

`sensitivity_ref` matters more than it looks: `1W` and `2.83V` are the same only at 8Ω. At 4Ω a 2.83V figure is 3 dB optimistic. Always record which one the datasheet stated — if it doesn't say, note that.

## Lighting entries

```json
{
  "model": "Solaris Wash 200",
  "class": "fixture",
  "beam_angle": 25,
  "zoom_range": "10-60",
  "lumens": 8000,
  "lux_at_5m": 2400,
  "power_w": 200,
  "dmx_channels": { "basic": 8, "standard": 16, "extended": 24 },
  "weight_kg": 7.2,
  "ip_rating": "IP20",
  "verified": true
}
```

`dmx_channels` is a map because fixtures publish several modes, and the mode chosen determines how many universe slots the fixture eats. That's the number a lighting designer actually needs.

## Series summary

Alongside the JSON, write `_series-summary.md` — a markdown table of the series. It exists so a human can eyeball the whole range in one screen and spot the gaps. Put verification status in its own column; that's usually the first thing anyone looks for.
