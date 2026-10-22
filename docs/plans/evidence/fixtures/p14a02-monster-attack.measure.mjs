import {createServer} from '/home/felixzhao/.zai/profiles/anonymous/worktrees/D2H5TextGame-human-worktree-2/node_modules/vite/dist/node/index.js';
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const wt='/home/felixzhao/.zai/profiles/anonymous/worktrees/D2H5TextGame-human-worktree-2';
const root=path.dirname(fileURLToPath(import.meta.url)),mode=process.argv[2];assert.ok(['baseline','candidate'].includes(mode));
const sha=b=>createHash('sha256').update(b).digest('hex');
const bytes=await readFile('/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-blood-raven-m76yc8no/catacombs-reviewed-report.json');
const prior=JSON.parse(bytes),opening=prior.runs[0].waves[3].opening;
assert.equal(opening.playerTeam[0].life,122); assert.equal(opening.playerTeam[1].life,181);assert.equal(opening.enemyTeam.length,13);
const exactSeed=(prior.seed^(4*0x9e3779b1))>>>0;
const files=execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z','src','package.json','package-lock.json'],{cwd:wt,encoding:'utf8'}).split('\0').filter(Boolean);
const sources=async()=>Object.fromEntries(await Promise.all(files.map(async f=>[f,sha(await readFile(path.join(wt,f)))])));
const hashes=await sources(),report={mode,pid:process.pid,head:execFileSync('git',['rev-parse','HEAD'],{cwd:wt,encoding:'utf8'}).trim(),priorSha:sha(bytes),scriptSha:sha(await readFile(fileURLToPath(import.meta.url))),grid:[0,999],samples:[],sources:hashes};
let server;
try {
 server=await createServer({configFile:false,root:wt,cacheDir:path.join(root,mode+'-cache'),server:{middlewareMode:true,hmr:false,ws:false},resolve:{alias:{'@':path.join(wt,'src')}}});
 const load=p=>server.ssrLoadModule('/'+p);
 const {runBattleRecorded}=await load('src/engine/combat/combat.ts');
 const {resolveChallengeWavePlan}=await load('src/engine/combat/sub-area-run.ts');
 const {buildEnemiesForWave}=await load('src/stores/combatHelpers.ts');
 const {default:areas}=await load('src/data/maps/sub-areas/act1.json');
 const area=areas.find(a=>a.id==='areas/act1-catacombs');assert.ok(area);
 const plan=resolveChallengeWavePlan({subArea:area,seed:prior.seed,challengeOrdinal:106,fallbackLevel:17,fallbackArchetypeId:'monsters/act1.fallen'});
 const wave=plan.waves[3];assert.equal(wave.spawns.length,13);report.wave=wave;
 const enemyTeam=buildEnemiesForWave(wave,exactSeed).map((u,i)=>({...u,gridPosition:opening.enemyTeam[i].gridPosition}));
 const withoutAttack=u=>{const o=structuredClone(u);delete o.stats.attack;delete o.attackRange;return o;};
 assert.deepEqual(enemyTeam.map(withoutAttack),opening.enemyTeam.map(withoutAttack));
 if(mode==='baseline')assert.deepEqual(enemyTeam,opening.enemyTeam);
 report.spawnRngAndAllNonAttackFieldsUnchanged=true;
 const playerTeam=opening.playerTeam; report.playerTeam=playerTeam;report.enemyTeam=enemyTeam;
 const run=seed=>{
  const input={seed,act:1,playerTeam,enemyTeam},before=JSON.stringify(input),recorded=runBattleRecorded(input);
  assert.equal(JSON.stringify(input),before);
  const {result,events}=recorded;
  const sample={seed,winner:result.winner,durationMs:events.at(-1).simClockMs,
   allies:result.playerTeam.map(u=>({id:u.id,life:u.life,mana:u.mana})),
   enemies:result.enemyTeam.map(u=>({id:u.id,life:u.life,mana:u.mana})),recordingSha:sha(JSON.stringify(recorded))};
  return {sample,recorded};
 };
 for(let seed=0;seed<1000;seed++)report.samples.push(run(seed).sample);
 report.exact=run(exactSeed);assert.deepEqual(run(exactSeed),report.exact);
 const wins=report.samples.filter(s=>s.winner==='player'),p=(a,q)=>a.length?[...a].sort((x,y)=>x-y)[Math.ceil(a.length*q)-1]:null;
 report.summary={wins:wins.length,draws:report.samples.filter(s=>s.winner===null).length,losses:report.samples.filter(s=>s.winner==='enemy').length,
  heroDeaths:report.samples.filter(s=>s.allies[0].life<=0).length,mercDeaths:report.samples.filter(s=>s.allies[1].life<=0).length,
  durationP50Ms:p(report.samples.map(s=>s.durationMs),.5),durationP95Ms:p(report.samples.map(s=>s.durationMs),.95),
  successfulTtkP50Ms:p(wins.map(s=>s.durationMs),.5),successfulTtkP95Ms:p(wins.map(s=>s.durationMs),.95),
  heroHpP50:p(report.samples.map(s=>s.allies[0].life),.5),heroMpP50:p(report.samples.map(s=>s.allies[0].mana),.5),
  mercHpP50:p(report.samples.map(s=>s.allies[1].life),.5),mercMpP50:p(report.samples.map(s=>s.allies[1].mana),.5)};
 if(mode==='candidate'){
  const baseline=JSON.parse(await readFile(path.join(root,'baseline-measure.json')));
  assert.equal(baseline.priorSha,report.priorSha);assert.deepEqual(baseline.playerTeam,playerTeam);
  assert.deepEqual(baseline.wave,wave);assert.deepEqual(baseline.enemyTeam.map(withoutAttack),enemyTeam.map(withoutAttack));
  report.transitions={};for(let i=0;i<1000;i++){assert.equal(baseline.samples[i].seed,report.samples[i].seed);const k=String(baseline.samples[i].winner)+'→'+String(report.samples[i].winner);report.transitions[k]=(report.transitions[k]??0)+1;}
 }
 assert.deepEqual(await sources(),hashes);report.sourcesUnchanged=true;console.log(JSON.stringify({mode,summary:report.summary,transitions:report.transitions,exact:report.exact.sample}));
}catch(e){report.error={message:e.message,stack:e.stack};process.exitCode=1;console.error(e);}finally{if(server)await server.close();await writeFile(path.join(root,mode+'-measure.json'),JSON.stringify(report,null,2)+'\n');}
