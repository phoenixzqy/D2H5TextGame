import { createServer, type Plugin } from 'vite';
import Ajv, { type AnySchema } from 'ajv';
import standalone from 'ajv/dist/standalone';
import { build } from 'esbuild';
import path from 'node:path';

const publicId = 'virtual:d2-save-validators';
export const compiledSaveValidatorsId = '\0' + publicId;
const keys = ['current33', 'frozen32', 'ledger'] as const;

async function generate(root: string): Promise<{ code: string; watchFiles: string[] }> {
  // Use Vite's normal eager JSON/glob semantics. No listeners, watcher, optimizer,
  // configured app plugins, file output, or runtime save is needed for capture.
  const server = await createServer({ root, configFile: false, publicDir: false,
    resolve: { alias: { '@': path.resolve(root, 'src') } },
    server: { middlewareMode: true, watch: null, hmr: false, ws: false },
    optimizeDeps: { noDiscovery: true, include: [] }, logLevel: 'error' });
  try {
    await server.ssrLoadModule('/src/engine/save/validate.ts');
    const { precompiledSaveSchemas } = await server.ssrLoadModule('/src/engine/save/schema-validator.ts') as {
      precompiledSaveSchemas: Record<string, AnySchema>
    };
    if (Object.keys(precompiledSaveSchemas).length !== keys.length ||
        keys.some(key => !Object.hasOwn(precompiledSaveSchemas, key))) {
      throw new Error('Expected exactly the three selected save schemas');
    }
    // Native saves use Draft07 and its defaults, not the catalog Ajv2020 options.
    const ajv = new Ajv({ strictNumbers: true, code: { source: true, esm: true } });
    for (const [key, schema] of Object.entries(precompiledSaveSchemas)) ajv.addSchema(schema, key);
    const validators = standalone(ajv, Object.fromEntries(keys.map(key => [key, key])));
    const compiled = await build({ stdin: { contents: validators, resolveDir: root,
      sourcefile: 'compiled-save-validators.js' }, bundle: true, format: 'esm',
      platform: 'browser', write: false, minify: true, target: 'es2022' });
    if (compiled.outputFiles.length !== 1) throw new Error('Expected one save validator module');
    const watchFiles: string[] = [];
    for (const id of server.moduleGraph.idToModuleMap.keys() as Iterable<unknown>) {
      if (typeof id === 'string' && id.startsWith(path.resolve(root, 'src') + path.sep)) watchFiles.push(id);
    }
    return { code: compiled.outputFiles.map(file => file.text).join(''), watchFiles };
  } finally {
    await server.close();
  }
}

/** Precompile three structural checks while keeping all native/history guards. */
export function precompileSaveValidators(): Plugin {
  let root: string, sourcePath: string, engineRoot: string, dataRoot: string;
  let compiled: ReturnType<typeof generate> | undefined;
  const relevant = (id: string): boolean => id.startsWith(engineRoot + path.sep) ||
    id.startsWith(dataRoot + path.sep);
  return {
    name: 'd2-precompile-save-validators', enforce: 'pre',
    configResolved(config) {
      root = config.root;
      engineRoot = path.resolve(root, 'src/engine');
      dataRoot = path.resolve(root, 'src/data');
      sourcePath = path.resolve(engineRoot, 'save/schema-validator.ts');
    },
    resolveId(id) { return id === publicId ? compiledSaveValidatorsId : undefined; },
    load(id) {
      if (id !== compiledSaveValidatorsId) return;
      this.addWatchFile(engineRoot);
      this.addWatchFile(dataRoot);
      compiled ??= generate(root);
      return compiled.then(result => {
        for (const file of result.watchFiles) this.addWatchFile(file);
        return result.code;
      });
    },
    transform(_code, id, options) {
      if (id.split('?')[0] !== sourcePath || options?.ssr) return;
      return { code: `import * as compiled from '${publicId}';
export function lazySaveValidator(ajv, schema, key) {
  let check;
  return () => {
    if (!check) {
      check = key ? compiled[key] : ajv.compile(schema);
      if (key) check.schema = schema;
    }
    return check;
  };
}`, map: null };
    },
    watchChange(id) { if (relevant(id)) compiled = undefined; },
    handleHotUpdate(context) {
      if (!relevant(context.file)) return;
      compiled = undefined;
      const module = context.server.moduleGraph.getModuleById(compiledSaveValidatorsId);
      if (module) context.server.moduleGraph.invalidateModule(module);
      context.server.ws.send({ type: 'full-reload' });
      return [];
    }
  };
}
