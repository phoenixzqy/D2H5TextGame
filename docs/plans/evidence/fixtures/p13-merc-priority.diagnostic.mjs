import { createServer } from '/home/felixzhao/.zai/profiles/anonymous/worktrees/D2H5TextGame-human-worktree-2/node_modules/vite/dist/node/index.js';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const wt='/home/felixzhao/.zai/profiles/anonymous/worktrees/D2H5TextGame-human-worktree-2';
const root=path.dirname(fileURLToPath(import.meta.url));
const inputPath='/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-cold-plains-diagnosis-f76nlumd/diagnostic-report.json';
const sha=b=>createHash('sha256').update(b).digest('hex');
const bytes=await readFile(inputPath);
assert.equal(sha(bytes),'f9e9464f1f2a35fa1602521d958a8910121c678ffd72a87cde497b8027803975');
const prior=JSON.parse(bytes), wave=prior.runs.at(-1).waves.at(-1);
const order=['mskill-inner-sight','mskill-pierce-arrow','mskill-basic-arrow'];
const seed=(prior.seed ^ ((wave.index+1)*0x9e3779b1))>>>0;
const snapshot={seed,playerTeam:wave.opening.playerTeam,enemyTeam:wave.opening.enemyTeam};
const report={kind:'one exact retained Cold Plains W3 priority-only diagnostic; no store settlement or awards',inputPath,inputSha:sha(bytes),scriptSha:sha(await readFile(fileURLToPath(import.meta.url))),seed,order,pid:process.pid};
let server;
try {
 server=await createServer({configFile:false,root:wt,cacheDir:path.join(root,'diagnostic-cache'),server:{middlewareMode:true,hmr:false,ws:false},resolve:{alias:{'@':path.join(wt,'src')}}});
 const {runBattleRecorded}=await server.ssrLoadModule('/src/engine/combat/combat.ts');
 report.opening=snapshot;
 const baseline=runBattleRecorded(snapshot);
 assert.deepEqual(baseline.events,wave.opening.recordedEvents);
 assert.deepEqual(baseline.result.playerTeam,wave.opening.outcome.finalPlayerTeam);
 assert.deepEqual(baseline.result.enemyTeam,wave.opening.outcome.finalEnemyTeam);
 report.exactBaselineReproduced=true; report.baseline=baseline;
 const candidateInput=structuredClone(snapshot);
 const merc=candidateInput.playerTeam.find(u=>u.kind==='merc'); assert.ok(merc);
 merc.skillOrder=order;
 const expected=structuredClone(snapshot); expected.playerTeam.find(u=>u.kind==='merc').skillOrder=order;
 assert.deepEqual(candidateInput,expected);
 report.candidateInput=candidateInput;
 report.candidate=runBattleRecorded(candidateInput);
 assert.deepEqual(snapshot,{seed,playerTeam:wave.opening.playerTeam,enemyTeam:wave.opening.enemyTeam});
 const summarize=b=>({winner:b.result.winner,terminalMs:b.events.at(-1).simClockMs,
  survivors:b.result.enemyTeam.filter(u=>u.life>0).map(u=>({id:u.id,life:u.life})),
  mercCasts:b.events.filter(e=>e.kind==='action'&&e.actor===merc.id).reduce((o,e)=>(o[e.skillId]=(o[e.skillId]??0)+1,o),{}),
  mercDamageIncludingOverkill:b.events.filter(e=>e.kind==='damage'&&e.source===merc.id).reduce((n,e)=>n+e.amount,0)});
 report.summary={baseline:summarize(baseline),candidate:summarize(report.candidate)};
 console.log(JSON.stringify(report.summary));
} catch(e) {report.error={message:e.message,stack:e.stack};process.exitCode=1;}
finally {if(server)await server.close();await writeFile(path.join(root,'priority-diagnostic.json'),JSON.stringify(report,null,2)+'\n');}
