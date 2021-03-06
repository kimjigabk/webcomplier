import { useEffect, useRef } from 'react';

interface PreviewProps {
  code: string;
}

// Event listener html to receive Message from parent
const html = `
    <html>
      <head></head>
      <body>
        <div id="root"></div>
        <script>
          window.addEventListener('message', (event) => {
            try {
              eval(event.data);
            } catch (err) {
              const root = document.querySelector('#root');
              root.innerHTML = '<div style="color: red;"><h4>Runtime Error</h4>' + err + '</div>'
              throw err;
            };
          }, false);
        </script>
      </body>
    </html>
    `;

const PreviewIframe: React.FC<PreviewProps> = ({ code }) => {
  const iframe = useRef<any>();

  // reset iframe srcdoc every time user clicks submit
  useEffect(() => {
    iframe.current.srcdoc = html;
    // send message to child iframe
    iframe.current.contentWindow.postMessage(code, '*');
  }, [code]);

  return (
    <iframe ref={iframe} sandbox="allow-scripts" title="child" srcDoc={html} />
  );
};

export default PreviewIframe;
