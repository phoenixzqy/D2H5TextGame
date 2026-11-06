# BUG-583 — Quest wish rewards display an untranslated field name

- Status: Implemented and verified.
- Severity: Low; players cannot identify the new currency consistently.
- Environment: QuestsScreen, zh-CN/en, ordinary fresh character.
- Reproduction: view Den of Evil's rewards after the authored15-wish bonus.
- Expected:15 祈愿石 /15 Wishstones, using the existing canonical gacha label.
- Actual: fallback wishstones:15, exposing the data key in either locale.
- Root cause: formatRewardItem handles gem shards and rune shards but has no
  wishstones case.
- Evidence: source fallback and existing bilingual card regression, extended
  before the correction. Browser comparison will use an isolated fresh context.
- Owner: root, sole writer. No layout or gameplay flow changes.
- Fix and validation: The existing gacha:wishstones locale label now formats wish rewards. Two bilingual rendered assertions fail before/pass after; ordinary browser baseline1/after4 cases verify Chinese/English at360×640 and1280×800, no document overflow, page exceptions or HTTP errors. No reward claim or campaign replay.
- Evidence: source authority24, bug580–583 affected check/browser receipts and
  docs/balance/2026-11-02-main-quest-wishes.md. Root retains the exact packet.
