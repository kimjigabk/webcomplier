import * as esbuild from 'esbuild-wasm';
import axios from 'axios';
import localForage from 'localforage';

const fileCache = localForage.createInstance({
  name: 'filecache',
});

export const fetchPlugin = (inputCode: string) => {
  return {
    name: 'fetch-plugin',
    setup(build: esbuild.PluginBuild) {
      build.onLoad({ filter: /(^index\.js$)/ }, async (args: any) => {
        return {
          loader: 'jsx',
          contents: inputCode,
        };
        // parse the index.js file, find any import/require/exports
        // args.path is updated
      });

      // Check if data is in cache
      build.onLoad({ filter: /.*/ }, async (args: any) => {
        // key: args.path
        // value: object {loader: .. , contents: .., resolveDir: ..}
        const cachedResult = await fileCache.getItem<esbuild.OnLoadResult>(
          args.path
        );
        if (cachedResult) {
          return cachedResult;
        }
      });

      // Attempt to load css file
      build.onLoad({ filter: /.css$/ }, async (args: any) => {
        const { data, request } = await axios.get(args.path); // content of index.js file
        // injecting css file inside js
        // import 'bulma/css/bulma.css'
        const escapedData = data
          .replace(/\n/g, '')
          .replace(/"/g, '\\""')
          .replace(/'/g, "\\'"); // so we don't close out string in contents
        const contents = `
              const style = document.createElement('style');
              style.innerText = '${escapedData}';
              document.head.appendChild(style);
            `;

        const result: esbuild.OnLoadResult = {
          loader: 'jsx',
          contents,
          resolveDir: new URL('./', request.responseURL).pathname,
        };

        // store result in cache
        await fileCache.setItem(args.path, result);

        return result;
      });

      build.onLoad({ filter: /.*/ }, async (args: any) => {
        // import react from 'react'
        const { data, request } = await axios.get(args.path); // content of index.js file
        const result: esbuild.OnLoadResult = {
          loader: 'jsx',
          contents: data,
          resolveDir: new URL('./', request.responseURL).pathname,
        };

        // store result in cache
        await fileCache.setItem(args.path, result);

        return result;
      });
    },
  };
};
