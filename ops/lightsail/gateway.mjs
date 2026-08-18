import http from "node:http";

const listenHost = process.env.GATEWAY_HOST ?? "0.0.0.0";
const listenPort = Number(process.env.GATEWAY_PORT ?? "8088");
const frontendPort = Number(process.env.FRONTEND_PORT ?? "3000");
const apiPort = Number(process.env.PORT ?? "4000");
const originToken = process.env.BNC_ORIGIN_TOKEN;
const publicHost =
  process.env.PUBLIC_HOST ?? "d3enmc1q3ihoro.cloudfront.net";

if (!originToken) {
  throw new Error("BNC_ORIGIN_TOKEN is required");
}

const server = http.createServer((request, response) => {
  if (request.headers["x-bnc-origin-token"] !== originToken) {
    response.writeHead(403, {
      "cache-control": "no-store",
      "content-type": "text/plain; charset=utf-8",
    });
    response.end("Forbidden\n");
    return;
  }

  const isApiRequest =
    request.url === "/api" || request.url?.startsWith("/api/");
  const targetPort = isApiRequest ? apiPort : frontendPort;
  const headers = { ...request.headers };

  delete headers["x-bnc-origin-token"];
  headers.host = `127.0.0.1:${targetPort}`;
  headers["x-forwarded-host"] = publicHost;
  headers["x-forwarded-proto"] = "https";
  headers["x-forwarded-port"] = "443";

  const proxyRequest = http.request(
    {
      host: "127.0.0.1",
      port: targetPort,
      method: request.method,
      path: request.url,
      headers,
    },
    (proxyResponse) => {
      response.writeHead(
        proxyResponse.statusCode ?? 502,
        proxyResponse.headers,
      );
      proxyResponse.pipe(response);
    },
  );

  proxyRequest.on("error", (error) => {
    if (!response.headersSent) {
      response.writeHead(502, {
        "cache-control": "no-store",
        "content-type": "text/plain; charset=utf-8",
      });
    }
    response.end("Origin service unavailable\n");
    process.stderr.write(`${new Date().toISOString()} ${error.message}\n`);
  });

  request.pipe(proxyRequest);
});

server.keepAliveTimeout = 65_000;
server.headersTimeout = 66_000;

server.listen(listenPort, listenHost, () => {
  process.stdout.write(
    `BNC gateway listening on ${listenHost}:${listenPort}\n`,
  );
});

function shutdown() {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
