import ReactDOM from 'react-dom';
import { useState, useEffect, useRef } from 'react';
import * as esbuild from 'esbuild-wasm';

import { unpkgPathPlugin } from './plugins/unpkg-path-plugin';
import { fetchPlugin } from './plugins/fetch-plugin';
import CodeEditor from './components/code-editor';
import PreviewIframe from './components/preview-iframe';

const App = () => {
  const [input, setInput] = useState('');
  const [code, setCode] = useState('');
  const ref = useRef<any>();

  const startService = async () => {
    ref.current = await esbuild.startService({
      worker: true,
      wasmURL: 'https://unpkg.com/esbuild-wasm@0.8.27/esbuild.wasm',
    });
  };
  useEffect(() => {
    startService();
  }, []);

  const onClick = async () => {
    // run after startService is activated
    if (!ref.current) {
      return;
    }

    const result = await ref.current.build({
      entryPoints: ['index.js'],
      bundle: true,
      write: false,
      plugins: [unpkgPathPlugin(), fetchPlugin(input)],
      define: {
        'process.env.NODE_ENV': '"production"',
        global: 'window',
      },
    });
    // bundled code =
    // result.outputFiles[0].text
    setCode(result.outputFiles[0].text);
  };

  const initialvalue = "console.log('Hi')";
  useEffect(() => {
    setInput(initialvalue);
  }, []);

  return (
    <div>
      <CodeEditor
        initialValue={initialvalue}
        onChange={(value) => setInput(value)}
      />
      <div>
        <button onClick={onClick}>Run Code</button>
      </div>
      <PreviewIframe code={code} />
    </div>
  );
};

ReactDOM.render(<App />, document.querySelector('#root'));
