# Background and clouds review

Branch: `codex/background-clouds-review`. Awaiting visual approval; not merged or deployed.

Implemented shared Home gradient, 30-second cloud passes with fade at both ends, full-viewport scenery and repeating lower cloud coverage, consistent emotion star assets, per-stage transparent paper clipping without multiply blending, Figma jar (229:285794) and jar companion (1:4046), and outer-field focus styling. Production tests now use current labels.

Verification: 6 unit tests, 17 existing browser tests, 2 production-configuration tests and 3 focused review tests passed. Review checks cover 320/390/430/768/834/1280 widths, paper transparency across 24 images, input focus and two full cloud loops. Production tests mock API/Turnstile and do not validate the live service.

Preview: run `npm run dev` and visit `/`; asset comparison is `/review-comparison.html`. Screenshots are in `output/background-review/`.

Paper-stage SVGs intentionally embed the original PNG artwork with a per-image clipping path; they are not full vector redraws. Floating stars, jar and mascot are vectors. This retains original shading at its existing 250-pixel resolution. Safari/Firefox have not been verified. Build retains the existing approximately 586 kB JavaScript warning.

Do not merge or deploy until the user approves the preview. Remove the review-only comparison page from the release if it is not intended for public viewing.
