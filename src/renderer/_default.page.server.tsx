// See https://vite-plugin-ssr.com/data-fetching
export const passToClient = ['pageProps', 'urlPathname'];

import ReactDOMServer, { renderToStaticMarkup } from 'react-dom/server';
import { PageShell } from './PageShell';
import type { PageContextServer } from './types';
import { dangerouslySkipEscape } from 'vite-plugin-ssr/server';

export async function render(pageContext: PageContextServer) {
  const { Page, pageProps } = pageContext;
  // This render() hook only supports SSR, see https://vite-plugin-ssr.com/render-modes for how to modify render() to support SPA
  if (!Page)
    throw new Error('My render() hook expects pageContext.Page to be defined');
  const pageHtml = ReactDOMServer.renderToString(
    <PageShell pageContext={pageContext}>
      <Page {...pageProps} />
    </PageShell>
  );

  // See https://vite-plugin-ssr.com/head
  const { documentProps } = pageContext.exports;
  const title = (documentProps && documentProps.title) || 'Vite SSR app';
  const desc =
    (documentProps && documentProps.description) || 'Cached Query Test';

  const documentHtml = renderToStaticMarkup(
    <div>
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="description" content={desc} />
      <title>{title}</title>
      <div id="page-view" dangerouslySetInnerHTML={{ __html: pageHtml }} />
    </div>
  );

  return {
    documentHtml: dangerouslySkipEscape(documentHtml),
    pageContext: {
      // We can add some `pageContext` here, which is useful if we want to do page redirection https://vite-plugin-ssr.com/page-redirection
    },
  };
}
