import axios from 'axios';
import * as esbuild from 'esbuild-wasm';

export const unpkgPathPlugin = () => {
  return {
    name: 'unpkg-path-plugin',
    setup(build: esbuild.PluginBuild) {
      build.onResolve({ filter: /.*/ }, async (args: any) => {
        console.log('onResolve', args);
        //Figure out where index.js is stored
        if (args.path === 'index.js') {
          return { path: args.path, namespace: 'a' };
        }

        // handle multi-file pakcage (relative path import inside package we imported)
        if (args.path.includes('./') || args.path.includes('../')) {
          return {
            namespace: 'a',
            path: new URL(
              args.path,
              'https://unpkg.com' + args.resolveDir + '/'
            ).href,
          };
        }
        // Figure out where the requested file is (from import/require)
        return {
          namespace: 'a',
          path: `https://unpkg.com/${args.path}`,
        };

        // else if (args.path === 'tiny-test-pkg') {
        //   return {
        //     path: 'https://unpkg.com/tiny-test-pkg@1.0.0/index.js',
        //     namespace: 'a',
        //   };
        // }
      });

      build.onLoad({ filter: /.*/ }, async (args: any) => {
        console.log('onLoad', args);

        if (args.path === 'index.js') {
          return {
            loader: 'jsx',
            contents: `
              const message = require('nested-test-pkg');
              console.log(message);
            `,
          };
        } // parse the index.js file, find any import/require/exports
        // args.path is updated

        //Attempt to load that file
        const { data, request } = await axios.get(args.path); // content of index.js file

        return {
          loader: 'jsx',
          contents: data,
          resolveDir: new URL('./', request.responseURL).pathname,
        };
      });
    },
  };
};
