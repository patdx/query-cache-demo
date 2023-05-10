// Note that this file isn't processed by Vite, see https://github.com/brillout/vite-plugin-ssr/issues/562

import {
  createApp,
  createRouter,
  eventHandler,
  fromNodeMiddleware,
  getRequestURL,
  setResponseHeader,
  setResponseStatus,
  toNodeListener,
  writeEarlyHints,
} from "h3";
import { renderPage } from "vite-plugin-ssr/server";
import { root } from "./root.js";
import { createServer } from "node:http";
const isProduction = process.env.NODE_ENV === "production";

startServer();

async function startServer() {
  const app = createApp();

  if (isProduction) {
    const sirv = (await import("sirv")).default;
    app.use(fromNodeMiddleware(sirv(`${root}/dist/client`)));
  } else {
    const vite = await import("vite");
    const viteDevMiddleware = (
      await vite.createServer({
        root,
        server: { middlewareMode: true },
      })
    ).middlewares;
    app.use(fromNodeMiddleware(viteDevMiddleware));
  }

  app.use(
    // "*",
    eventHandler(async (event) => {
      const url = getRequestURL(event);

      const pageContextInit = {
        urlOriginal: url.pathname + url.search + url.hash,
      };
      const pageContext = await renderPage(pageContextInit);

      const { httpResponse } = pageContext;

      if (!httpResponse) return;

      const { earlyHints, statusCode, contentType } = httpResponse;

      writeEarlyHints(event, { link: earlyHints.map((e) => e.earlyHintLink) });

      setResponseHeader(event, "content-type", contentType);
      setResponseStatus(event, statusCode);

      return pageContext.httpResponse.body;
    }),
  );

  const port = process.env.PORT || 3000;
  createServer(toNodeListener(app)).listen(port);
  console.log(`Server running at http://localhost:${port}`);
}
