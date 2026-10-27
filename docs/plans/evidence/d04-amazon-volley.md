# D04 — Amazon seeking hit, widening cone and repeated volley

Author implementation checkpoint; independent acceptance and earned balance
remain open. Contract: [D04 volley](../decisions/D04-amazon-volley-v1.md);
BUG284–287 retain native mechanic and public-observer failures.

## Delivered behavior

- Guided Arrow: JSON `alwaysHits:true` follows public source/effect types and
  adapter into existing `ignoreDodge`; bypasses ordinary hit/dodge/Blind, while
  keeping resistance,Defense,critical,personal absorption and reflection.
- Multiple Shot: new three-row1/3/5 `cone-3`,maximum5living hostiles in existing
  geometric/order selection. Sparse coverage never fills from outside.
- Strafe: two ordered `each-original` passes across the original living enemy
  pool. Independent attempts/misses/crit/mitigation/reflection,skip dead without
  redistribution,stop on caster death; charge mana/CD once. Two passes remain
  provisional author potency,not independent or earned balance approval.

Existing damage/growth/payment/CD/eligibility/prerequisites/rank caps remain;
no new equipment gate,save field,version,scheduler,movement or range stat. Schema
rejects foreign/missing/contradictory capabilities and changed pass counts.

Commits: guaranteed hit `52880d01`;cone primitive `f366fb56`/lint `4428e5b7`;
authored schema/data/types/native `677fb25d`;bilingual display/UI `dceffcf4`.

## Meaningful checks

Actual native projection uses legal class/level/allocation/prerequisites and
canonical inventory equip.24cases cover literal rank1/20 HP/MP,high dodge/Blind,
resistance/Defense,missed attempts,sparse cone/cap,dead/lethal targets,reflection/
caster death/shield depletion,replay,input immutability and runBattle parity.
Schema56cases,guaranteed-hit8 and cone3 geometry2 guard primitive/data boundaries.
UI30new cases cover en/zh-CN ranks0/1/19/20,allocation and exact MAX preview;
40four-arrow controls also pass.

Literal native oracles: Guided seed41 damage96/210;Multiple seed7 ordered
[41,50,45,45,50]/[117,126,121,121,126] at tip,left,middle,right,back-left;
Strafe seed7 [36,45,40,40]/[112,121,116,116] at target,reserve,target,reserve.

Actual authored native/schema80/2PASS9.626s;native strict types7.126s and
lint7.703sPASS. Actual UI70/2PASS16.055s;UI types8.769s/lint10.185sPASS.
Primitive93/3PASS7.451s,cone7/2PASS1.360s with final lintPASS6.682s.

Original six native failures/one control and expanded11failures/13controls,
30preview REDs and off-repo prototypes remain retained. The seed7 guaranteed
miss draft violated the shared5% hit floor;seed41 supplies the correct control.
Native-vs-recorded ID assertions,hero-only shield setup,discriminated event
narrowing and schema-test TS/lint issues were corrected without weakening
runtime assertions. No suppression,skip,threshold or global hit rule was added.

## Production and integrated work

Official production build PASS14.997s;all762outputs hashed. Six emitted JS
chunks have zero test-bridge tokens;actual756URLprecache checkPASS0.206s.
Existing large-chunk/2.57MB manifest-precache warnings remain;no performance
signoff is implied. First public browser attempt fails from BUG287's case-
sensitive Physical observer,with actual103physical hit visible in retained DOM.
Three first-attempt English desktop panel PNGs were individually inspected:
MAX damage,identity,payment/CD and requirements are readable inside each captured
panel;these crops do not establish whole-screen/mobile/Chinese/a11y acceptance.
Final public `4a80c03a` passes4/4contexts100.913s runner/99.611sPlaywright,
zero skips/retries/flakes. English/Chinese × desktop/Pixel5 uses ordinary create/
import/equip,all three19→20/MAX,priority,actual Catacombs selected-skill cast and
positive hostile Physical hit,Pause/Flee/Save/close/new-page/Continue. Damage
observed in every context:Guided103,Multiple47,Strafe43. Observer resets at every
following action;native tests establish precise mechanic/lifecycle behavior.

Eight exact seven-domain pairs,four actual service-worker offline Continues,
60geometry samples at360×640,412×915,640×360,1280×800,1920×1080 with44px
allocation targets/no document overflow pass. No `__GAME__` and zero page/
console errors asserted. Final explicit publiclint8.448s/types7.981s pass.
Twelve final mobile PNGs were individually inspected:all six localized previews
are readable,Guided103 popup and Multiple/Strafe HP loss visible. Strafe grid
crops include fixed-header/nav overlays;lower preview requirements are partly
cropped,emoji/navigation clipping remains existing. Twelve desktop originals
are retained but not individually reviewed. No whole-app visual/a11y acceptance.

The original full-unit run92363 is terminal exit1 after808.491s:
864files/18648tests passed,two existing skips,one suite failed during its
79-case beforeAll. All2438code/config/test inputs stayed exact,but root committed
documentation while it ran,changing Git HEAD. The existing provenance guard
correctly rejected that drift in earned-comparison.test.ts. This is a validation
procedure failure;no product/test assertion change is justified. No current
integrated full-suite pass is claimed. Retry requires frozen bytes AND HEAD.

Engine regression9556tests/362filesPASS171.800s,all2436captured inputs exact.
Fulltypes121.394s/fulllint200.933s pass against2438explicit inputs. The sole
subsequent change is BUG287's public-observer correction,then final focused
public types/lint pass. All other2437inputs and all762build files remain exact.
Earlier full18607/860/two existing opt-in skips belongs to the preceding
snapshot and does not validate these runtime changes. The original full-unit consumer92363 has ended. A focused stable-HEAD
retry must pass before one fresh full suite;no repository edits or commits
are permitted during either consumer.

## Terminal checkpoint and retention

Stable focused retry79/1PASS25.228s,then full18727tests/865files/two existing
skipsPASS825.840s at `bffa9517`,with all2438captured inputs and before/after
Git HEAD exact. No test or provenance assertion was changed. Original failed
full receipt/log remains retained. This closes only the bounded local checkpoint.

Root archived1268raw evidence members and read back/hash-verified every member
before deleting2031exact task-owned files and23directories. All762build hashes
and both protected-save hashes were exact;preview4597 was closed. Disposable
production-dist/Vitest cache are removed;remaining[]/failures[]. Root retains:

- `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-amazon-volley-l7m0tvg6-retained.tar.gz`
- `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-amazon-volley-l7m0tvg6-retention.json`
- `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-amazon-volley-l7m0tvg6-cleanup.json`

Archive SHA256:`bd337722c0bf806480beb92001797948b05928d1668faeee6685dc3468f0ab24`.
Root removes this archive and both sidecars only after full-v1 evidence consumers
and independent review finish. New javelin diagnosis/prototypes are separately
copied/root-owned and do not require the old raw task or build.

## Ownership and scope

The former raw task is removed;the retained archive and sidecars above supply
its historical evidence. Exactly Guided/Multiple/Strafe now receive bounded
functional credit:182bounded/29unverified/one engine-only/one review-needed.
The other210raw inventory rows,header,213IDs and order remain exact;this is not
independent acceptance,earned build viability or a whole-game percentage.
Protected genuine campaign remainsL33,Ancients/Rite
claimed,Baal uncleared,nextNormal402;no campaign/replay,remote action,delegation
or independent self-approval. Constructed fixtures do not establish earned
builds,pacing,economy,endgame or complete mobile/a11y/PWA/performance acceptance.
C2–C4/fullG0–G7 and full privatev1 remain open;original goal/worktree continue.
