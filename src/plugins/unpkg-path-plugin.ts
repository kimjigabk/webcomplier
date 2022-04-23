import * as esbuild from 'esbuild-wasm';

export const unpkgPathPlugin = () => {
  return {
    name: 'unpkg-path-plugin',
    setup(build: esbuild.PluginBuild) {
      build.onResolve({ filter: /(^index\.js$)/ }, () => {
        //Figure out where root index.js is stored
        return { path: 'index.js', namespace: 'a' };
      });

      build.onResolve({ filter: /^\.+\// }, async (args: any) => {
        // handle relative path import inside package we imported
        return {
          namespace: 'a',
          path: new URL(args.path, 'https://unpkg.com' + args.resolveDir + '/')
            .href,
        };
      });

      build.onResolve({ filter: /.*/ }, async (args: any) => {
        // handle main file of the module
        return {
          namespace: 'a',
          path: `https://unpkg.com/${args.path}`,
        };
      });
    },
  };
};
