import sys,subprocess,time,pathlib,json,datetime
p=pathlib.Path(__file__).parent
label=sys.argv[1]
assert label.replace('-', '').replace('_','').isalnum()
assert not (p/(label+'.log')).exists() and not (p/(label+'.json')).exists()
start=time.monotonic()
with (p/(label+'.log')).open('w') as out:
 r=subprocess.run(sys.argv[2:],stdout=out,stderr=subprocess.STDOUT)
receipt={'argv':sys.argv[2:],'cwd':str(pathlib.Path.cwd()),'exit':r.returncode,'seconds':round(time.monotonic()-start,3),'finished':datetime.datetime.now(datetime.timezone.utc).isoformat()}
(p/(label+'.json')).write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps(receipt))
print((p/(label+'.log')).read_text()[-6500:])
sys.exit(r.returncode)
