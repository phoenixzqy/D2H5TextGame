# BUG-397 — Show the Vitality label during character creation

- Status: Fixed locally; bounded current32 integrated acceptance APPROVED (see final acceptance below).
- Severity: Medium — the attribute value appears with an invalid translation.
- Build: uncommitted successor32 on `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`.
- Environment: character creation, both zh-CN and en, all viewports; no RNG seed.
- Affected systems: character creation/i18n (`frontend-dev`, `writer`).

## Reproduction

1. Open a new character and select a class.
2. Read the Vitality row in the starting attributes.

Expected: the localized attribute name, `体力` or `Vitality`, and its numeric value.

Actual: `CharacterCreate` requests `character:vitality`, which became an object
containing the effective-Vitality explanation keys. It is not a string label.
The existing string label is `character:attributes.vitality` in both locales.

## Evidence and correction

The optional static scan records the missing string reference in the retained
packet `successor32-i18n-v1.log`. Extend the existing class-preview assertion to
require the readable label, then use the existing attribute label key. This
preserves the separate composition explanations. Production browser validation
must also cover class creation in both locales.

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
`character-vitality-label-red-v1` retains the actual failed readable-label
assertion. The one-line key correction makes the complete CharacterCreate
suite pass36/36 (`character-vitality-label-green-v1`). Final baseline browser
validation passes both localized labels before fixture import in the final
Chinese/English baseline cases over all five viewports. Full-unit integration
acceptance remains pending.

## Final acceptance

The later [integrated current32 evidence](../../docs/plans/evidence/p14-successor32.md#final-bounded-local-acceptance) supersedes pending integration notes above. `d2-counted-source-z3jj3xa1/current32-acceptance.json` retains exact source, reconciled unit coverage, green terminal checks, headed-browser evidence and cleanup. Original failures stay retained; no uninterrupted full-green, earned pacing or full-v1 acceptance is claimed.
