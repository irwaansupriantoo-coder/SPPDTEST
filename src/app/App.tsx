import { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AuthProvider } from './context/AuthContext';

export default function App() {
  useEffect(() => {
    // Maze Analytics Snippet
    (function (m: any, a: Document, z: string, e: string) {
      var s: HTMLScriptElement, t: string | null = null, u: HTMLScriptElement | null, v: string | null | undefined;
      try {
        t = m.sessionStorage.getItem('maze-us');
      } catch (err) {}

      if (!t) {
        t = new Date().getTime().toString();
        try {
          m.sessionStorage.setItem('maze-us', t);
        } catch (err) {}
      }

      u = a.currentScript as HTMLScriptElement || (function () {
        var w = a.getElementsByTagName('script');
        return w[w.length - 1] as HTMLScriptElement;
      })();
      v = u && u.nonce;

      s = a.createElement('script');
      s.src = z + '?apiKey=' + e;
      s.async = true;
      if (v) s.setAttribute('nonce', v);
      a.getElementsByTagName('head')[0].appendChild(s);
      m.mazeUniversalSnippetApiKey = e;
    })(window, document, 'https://snippet.maze.co/maze-universal-loader.js', '11c1c4c2-761e-4b94-8acf-d0a6f3085321');
  }, []);

  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
