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
      build.onLoad({ filter: /.*/ }, async (args: any) => {
        if (args.path === 'index.js') {
          return {
            loader: 'jsx',
            contents: inputCode,
          };
        } // parse the index.js file, find any import/require/exports
        // args.path is updated

        // Attempt to load that file
        // Check if data is in cache
        // key: args.path
        // value: object {loader: .. , contents: .., resolveDir: ..}
        const cachedResult = await fileCache.getItem<esbuild.OnLoadResult>(
          args.path
        );
        if (cachedResult) {
          return cachedResult;
        }

        // otherwise store result in cache
        const { data, request } = await axios.get(args.path); // content of index.js file

        // also handle css import
        const fileType = args.path.match(/.css$/) ? 'css' : 'jsx';
        // include css in js
        const contents =
          fileType === 'css'
            ? `
            const style = document.createElement('style');
            style.innerText = 'body { background-color: "red" }';
            document.head.appendChild(style);
          `
            : data;
        const result: esbuild.OnLoadResult = {
          loader: 'jsx',
          contents,
          resolveDir: new URL('./', request.responseURL).pathname,
        };
        await fileCache.setItem(args.path, result);

        return result;
      });
    },
  };
};
