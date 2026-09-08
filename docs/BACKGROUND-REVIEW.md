# Background and clouds review

Branch: `codex/background-clouds-review`. Awaiting visual approval; not merged or deployed.

Implemented shared Home gradient, 30-second cloud passes with fade at both ends, full-viewport scenery and repeating lower cloud coverage, consistent emotion star assets, per-stage transparent paper clipping without multiply blending, Figma jar (229:285794) and jar companion (1:4046), and outer-field focus styling. Production tests now use current labels.

Verification: 6 unit tests, 17 existing browser tests, 2 production-configuration tests and 3 focused review tests passed. Review checks cover 320/390/430/768/834/1280 widths, paper transparency across 24 images, input focus and two full cloud loops. Production tests mock API/Turnstile and do not validate the live service.

Preview: run `npm run dev` and visit `/`; asset comparison is `/review-comparison.html`. Screenshots are in `output/background-review/`.

Latest star replacement: all 24 stages are now exact vector groups exported from Figma section `245:75557`, matched by emotion name. Node mappings are recorded in `scripts/star-sources.json`; `scripts/import-figma-stars.cjs` removes only ancestor frame backgrounds and centers the original artwork on a shared 560×560 canvas. No embedded PNGs or legacy clipping paths remain in the runtime star assets. The approved jar and companion are unchanged.

Folded stars are used for choices, floating/sent stars, jar contents, lists and standalone decoration. Reading, preview and popup use stage 04; unfolding follows stages 01–04 and folding reverses them. Existing motion timing and reduced motion are unchanged.

Latest verification: 19 browser tests passed, including responsive layouts at six widths, transparency of all 24 SVGs, 120-character text at four widths, folding timing, saving, sending and popup. Two production-configuration tests passed on isolated port 5186; these mock API/Turnstile rather than validating the live service. The unchanged two-loop cloud test passed in the prior review round and was not repeated in this star-only update. Safari/Firefox have not been verified. Build retains the existing large JavaScript chunk warning.

Do not merge or deploy until the user approves the preview. Remove the review-only comparison page from the release if it is not intended for public viewing.
