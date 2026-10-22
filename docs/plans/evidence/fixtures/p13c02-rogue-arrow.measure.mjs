import {createServer} from '/home/felixzhao/.zai/profiles/anonymous/worktrees/D2H5TextGame-human-worktree-2/node_modules/vite/dist/node/index.js';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const wt='/home/felixzhao/.zai/profiles/anonymous/worktrees/D2H5TextGame-human-worktree-2';
const root=path.dirname(fileURLToPath(import.meta.url));
const mode=process.argv[2];assert.ok(['baseline','candidate'].includes(mode));
const sha=b=>createHash('sha256').update(b).digest('hex');
const priorBytes=await readFile('/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-cold-plains-diagnosis-f76nlumd/diagnostic-report.json');
assert.equal(sha(priorBytes),'f9e9464f1f2a35fa1602521d958a8910121c678ffd72a87cde497b8027803975');
const prior=JSON.parse(priorBytes),wave=prior.runs.at(-1).waves.at(-1);
const exactSeed=(prior.seed ^ ((wave.index+1)*0x9e3779b1))>>>0;
const snapshot={seed:exactSeed,playerTeam:wave.opening.playerTeam,enemyTeam:wave.opening.enemyTeam};
// This fixed recipe was selected before any candidate output: existing paid hero/earned gear,
// only the already available Rogue priority choice. No seed is selected for future gameplay.
snapshot.playerTeam.find(u=>u.kind==='merc').skillOrder=['mskill-inner-sight','mskill-pierce-arrow','mskill-basic-arrow'];
const files=execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z','src','package.json','package-lock.json'],{cwd:wt,encoding:'utf8'}).split('\0').filter(Boolean);
const sources=async()=>Object.fromEntries(await Promise.all(files.map(async f=>[f,sha(await readFile(path.join(wt,f)))])));
const hashes=await sources();
const report={mode,kind:'bounded 1000-seed retained earned Cold Plains W3 screen; no route/rewards/balance acceptance',head:execFileSync('git',['rev-parse','HEAD'],{cwd:wt,encoding:'utf8'}).trim(),pid:process.pid,scriptSha:sha(await readFile(fileURLToPath(import.meta.url))),priorSha:sha(priorBytes),snapshotSha:sha(JSON.stringify(snapshot)),snapshot,sources:hashes,seeds:[0,999],samples:[]};
let server;
try {
 server=await createServer({configFile:false,root:wt,cacheDir:path.join(root,mode+'-cache'),server:{middlewareMode:true,hmr:false,ws:false},resolve:{alias:{'@':path.join(wt,'src')}}});
 const {runBattleRecorded}=await server.ssrLoadModule('/src/engine/combat/combat.ts');
 const {getSkill}=await server.ssrLoadModule('/src/engine/skills/registry.ts');
 report.skills=['mskill-basic-arrow','mskill-pierce-arrow'].map(getSkill);
 const summarize=(b,seed)=>{
  const hero=snapshot.playerTeam.find(u=>u.kind==='hero'),merc=snapshot.playerTeam.find(u=>u.kind==='merc');
  const damage=b.events.filter(e=>e.kind==='damage'&&e.source===merc.id),landed=damage.filter(e=>!e.dodged);
  const durationMs=b.events.at(-1).simClockMs;
  const mana=b.events.filter(e=>e.kind==='mana'&&e.target===hero.id).map(e=>e.mana);
  return {seed,winner:b.result.winner,durationMs,heroDied:b.result.playerTeam.find(u=>u.id===hero.id).life<=0,
   mercDamageIncludingOverkill:damage.reduce((n,e)=>n+e.amount,0),mercDpsIncludingOverkill:damage.reduce((n,e)=>n+e.amount,0)*1000/durationMs,
   mercHitAttempts:damage.length,mercDodges:damage.filter(e=>e.dodged).length,mercLanded:landed.length,mercCrits:landed.filter(e=>e.crit).length,
   minimumHeroMana:Math.min(hero.mana,...mana),enemyRemainingHp:b.result.enemyTeam.reduce((n,u)=>n+Math.max(0,u.life),0)};
 };
 const start=performance.now();
 for(let seed=0;seed<1000;seed++) {
  const input={...snapshot,seed},before=JSON.stringify(input),battle=runBattleRecorded(input);
  assert.equal(JSON.stringify(input),before);report.samples.push(summarize(battle,seed));
 }
 report.wallSeconds=(performance.now()-start)/1000;
 const exact=runBattleRecorded(snapshot);report.exact={...summarize(exact,exactSeed),recorded:exact};
 const p=(values,q)=>values.length?[...values].sort((a,b)=>a-b)[Math.ceil(values.length*q)-1]:null;
 const wins=report.samples.filter(s=>s.winner==='player');
 report.summary={wins:wins.length,draws:report.samples.filter(s=>s.winner===null).length,heroDeaths:report.samples.filter(s=>s.heroDied).length,
  successfulTtkP50Ms:p(wins.map(s=>s.durationMs),.5),successfulTtkP95Ms:p(wins.map(s=>s.durationMs),.95),
  mercDpsIncludingOverkillP50:p(report.samples.map(s=>s.mercDpsIncludingOverkill),.5),
  minimumHeroMana:Math.min(...report.samples.map(s=>s.minimumHeroMana)),
  mercHitAttempts:report.samples.reduce((n,s)=>n+s.mercHitAttempts,0),mercDodges:report.samples.reduce((n,s)=>n+s.mercDodges,0),mercLanded:report.samples.reduce((n,s)=>n+s.mercLanded,0),mercCrits:report.samples.reduce((n,s)=>n+s.mercCrits,0)};
 assert.deepEqual(await sources(),hashes);report.sourcesUnchanged=true;console.log(JSON.stringify({mode,summary:report.summary,wallSeconds:report.wallSeconds,exact:report.exact.winner}));
}catch(e){report.error={message:e.message,stack:e.stack};process.exitCode=1;}
finally{if(server)await server.close();await writeFile(path.join(root,mode+'-measure.json'),JSON.stringify(report,null,2)+'\n');}
