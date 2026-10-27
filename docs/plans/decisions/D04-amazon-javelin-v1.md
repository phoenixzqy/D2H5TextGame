# D04 — Amazon impact bolts, Poison cloud and Lightning chain

Root author implementation contract,2026-10-26;BUG288 has eight actual native
feature REDs/one ordinary control at ranks1/20. Independent design/QA and earned
balance remain open. No source change until original volley full-unit92363 is
terminal and its2438explicit inputs read back exact.

| Skill | Existing primary and eligibility preserved | Missing authored behavior |
| --- | --- | --- |
| Power Strike | base40–60,+4/rank,10MP/1s,unlock6,Jab prerequisite,cap20 | Honor existing physical30/lightning30 breakdown as one equal-weight mixed primary hit;on landing,up to2additional Lightning attempts at that same original living target,each10–15,+1/rank. |
| Charged Strike | Lightning70–100,+6/rank,20MP/2s,unlock18,Lightning Bolt prerequisite,cap20 | On landing,one independent Lightning attempt at each of up to2other originally living adjacent hostiles,each35–50,+3/rank. |
| Poison Javelin | Poison20–35,+3/rank,10MP/2s,unlock6,Jab prerequisite,cap20 | An impact cloud uses existing3×3 area selection,cap9,one independent Poison hit/status attempt per covered living hostile. |
| Lightning Strike | Lightning80–110,+7/rank,25MP/2s,unlock24,Charged Strike prerequisite,cap20 | Existing nearest-neighbor chain selector,cap5distinct living hostiles,ordinary independent hits with Paralyze. |

The two impact-bolt counts and additional per-bolt damage are provisional
author potency for existing unspecified plural-bolt promises,not final balance
approval. Power's existing30:30 weights determine primary equal shares;one
base/hit/crit decision,independent typed mitigation,component rounding as in the
existing weighted primitive. The Lightning carrier retains its existing ordinary
magic-hit/dodge decision. No weapon Attack scaling or new equipment gate.

## Impact bolts

Add closed JSON-owned `onHitBolts:{count:2,targetMode,damage:{min,max,perRank}}`,
with `original` for Power and `adjacent-others` for Charged. Public source/effect
types and adapter carry the immutable packet. Restrict its schema to these exact
identities,targets,primary types/weights,numbers,eligibility and rank caps;reject
foreign/missing/contradictory tuning. Weighted composition is extended to Power
only;existing Vengeance/Phoenix component order/status semantics stay intact.

Reuse ordinary damage settlement at the landed-primary boundary. Snapshot the
original bolt target IDs before primary damage;run bolts only after the primary
finishes mitigation,status,death,personal shields,armor retaliation,reflection
and recovery. A miss never emits bolts;an absorbed but landed primary may.
Stop when caster dies. Each bolt has fresh ordinary hit/crit/mitigation/shield/
reaction/death/recovery settlement;it carries no onHitBolts,weighted components,
primary statuses or recursive capability. Pay mana/CD only for the parent cast.

Power repeats only the same original victim,skipping its remaining attempts on
death without spilling. Charged excludes the primary,dead,friendly and converted
allied units. Adjacency is the primary-anchored existing cross footprint,not a
maximum-coverage recentering or a new range stat. Preserve existing hostile
priority among covered candidates,cap2before settlement;one bolt per selected
original,misses consume attempts,dead selections skipped without replacements.
No outside-footprint fill and no new targets acquired after primary damage.

## Cloud and chain

Poison cloud is the impact footprint plus Poison lingering on those hit:5s,
up to10stacks,the existing5%final-hit/s rate floored/minimum1;ordinary refresh
retains existing rate and adds one stack to cap. Rank changes initial direct
potency,not the shared Poison lifecycle. This promise says releases a cloud;
no moving projectile,trail,ongoing ground-field/new-spawn trigger or extra
scheduler is introduced. Existing geometric anchor/ties/grid target order apply;
cap9after selection,sparse areas never fill from outside.

Lightning chain starts at existing target priority,then nearest Manhattan-grid
neighbor,priority on ties,distinct original IDs,max5. Misses consume attempts;
no sixth replacement. Each landed hit retains shared1s Paralyze/max1 and its
existing reapplication behavior. Stop on caster death;dead originals are skipped.
No new range/movement stats or save fields/version. Ordinary Lightning Bolt and
all unrelated area/chain/periodic/status rules stay unchanged.

## Implementation and evidence

1. Keep current source frozen;author causal native REDs/schema/display tests
   and verify a prospective implementation outside the repository.
2. After old full consumer terminates,close its retention/read-back/exact
   cleanup and reconcile only its three skills. New javelin artifacts are
   separately root-owned,so they cannot keep the old task/build alive.
3. Implement bounded source increments:impact primitive/types/adapter plus
   focused primitive checks;then schema/data/native contracts;then bilingual
   source-backed current/next/MAX display. Each increment≤5repository paths.
4. Verify native actual class/level/allocation/prerequisites/canonical equip,
   rank1/20 literal HP/MP,typed mitigation and shared-primary hit/crit,miss/
   absorption,dead and lethal primaries/selected neighbors,caster retaliation
   death,Poison expiry/refresh/cap,chain geometry/order/cap,negative eligibility/
   resource and replay/immutability/runBattle parity.
5. Public create/import/equip,19→20/MAX,priority,actual typed casts/hits/Poison
   chips+positive DoT/Paralyze where observable;en/zh-CN desktop/mobile,44px/no
   overflow,Pause/Flee/Save/close/new-page/online+actual SWoffline Continue and
   exact seven-domain restoration. Native tests prove precise mechanics;public
   fixtures establish integration,not earned builds or balance.
6. One stable applicable integrated engine/full/types/lint/build/bridge/precache
   checkpoint after final source/public tests;preserve failures,retain/read-back/
   exact task-owned cleanup before any bounded inventory credit.

New active task:`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-amazon-javelin-dhkq0oqy`.
Root owns original/copied REDs,prospective configs/overlays,caches and eventual
retention/cleanup. Exact external path registry scratch was removed after use;
no independent/earned approval,remote action,campaign/replay or delegation.

Author plan challenge:ready. Material risks are explicit provisional potency,
shared-primary versus independent-bolt RNG,pre-impact target capture and death/
retaliation order;the contract and causal tests cover them. This is author
planning,not independent gate approval. Security check:pass;first-party local
gameplay/schema/UI/tests only,no secrets,dependencies,CI,remote or genuine save
action. Full privatev1 and original registered worktree/goal remain open.
