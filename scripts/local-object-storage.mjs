import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const host = "127.0.0.1";
const port = Number(process.env.LOCAL_OBJECT_STORAGE_PORT ?? 9000);
const storageRoot = path.resolve(process.env.LOCAL_OBJECT_STORAGE_DIR ?? ".local-object-storage");
const maximumBytes = 30_000_000;

const xmlEscape = (value) => String(value).replace(/[<>&'"]/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[character]);
const safeObjectPath = (pathname) => {
  const segments = pathname.split("/").filter(Boolean).map((segment) => decodeURIComponent(segment));
  if (segments.length < 2 || segments.some((segment) => segment === "." || segment === ".." || segment.includes("\\"))) return null;
  const target = path.resolve(storageRoot, ...segments);
  return target.startsWith(`${storageRoot}${path.sep}`) ? target : null;
};
const metadataPath = (target) => `${target}.metadata.json`;
const collectBody = (request) => new Promise((resolve, reject) => {
  const chunks = [];
  let size = 0;
  request.on("data", (chunk) => {
    size += chunk.length;
    if (size > maximumBytes) {
      reject(new Error("Object exceeds the local development limit."));
      request.destroy();
      return;
    }
    chunks.push(chunk);
  });
  request.on("end", () => resolve(Buffer.concat(chunks)));
  request.on("error", reject);
});
const storedMetadata = async (target) => JSON.parse(await readFile(metadataPath(target), "utf8"));
const sendStoredHeaders = (response, metadata, size) => {
  response.setHeader("content-length", size);
  response.setHeader("content-type", metadata.contentType || "application/octet-stream");
  if (metadata.checksum) response.setHeader("x-amz-checksum-sha256", metadata.checksum);
  for (const [name, value] of Object.entries(metadata.userMetadata ?? {})) response.setHeader(`x-amz-meta-${name}`, value);
  response.setHeader("etag", `"${metadata.etag}"`);
};

await mkdir(storageRoot, { recursive: true });
const server = createServer(async (request, response) => {
  try {
    const target = safeObjectPath(new URL(request.url, `http://${host}:${port}`).pathname);
    if (!target) {
      response.writeHead(400).end("Invalid object path.");
      return;
    }
    if (request.method === "PUT") {
      const copySource = request.headers["x-amz-copy-source"];
      const body = copySource ? await readFile(safeObjectPath(String(copySource)) ?? "") : await collectBody(request);
      const sourceMetadata = copySource ? await storedMetadata(safeObjectPath(String(copySource)) ?? "") : null;
      const checksum = String(request.headers["x-amz-checksum-sha256"] ?? sourceMetadata?.checksum ?? createHash("sha256").update(body).digest("base64"));
      const etag = createHash("md5").update(body).digest("hex");
      const userMetadata = sourceMetadata?.userMetadata ?? Object.fromEntries(Object.entries(request.headers)
        .filter(([name]) => name.startsWith("x-amz-meta-"))
        .map(([name, value]) => [name.slice("x-amz-meta-".length), String(value)]));
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, body);
      await writeFile(metadataPath(target), JSON.stringify({ contentType: sourceMetadata?.contentType ?? request.headers["content-type"], checksum, etag, userMetadata }));
      response.setHeader("etag", `"${etag}"`);
      if (copySource) {
        response.setHeader("content-type", "application/xml");
        response.end(`<CopyObjectResult><LastModified>${new Date().toISOString()}</LastModified><ETag>${xmlEscape(`"${etag}"`)}</ETag></CopyObjectResult>`);
      } else response.writeHead(200).end();
      return;
    }
    if (request.method === "HEAD" || request.method === "GET") {
      const [details, metadata] = await Promise.all([stat(target), storedMetadata(target)]);
      sendStoredHeaders(response, metadata, details.size);
      if (request.method === "HEAD") response.writeHead(200).end();
      else response.end(await readFile(target));
      return;
    }
    if (request.method === "DELETE") {
      await Promise.all([rm(target, { force: true }), rm(metadataPath(target), { force: true })]);
      response.writeHead(204).end();
      return;
    }
    response.writeHead(405).end("Method not allowed.");
  } catch (error) {
    const status = error?.code === "ENOENT" ? 404 : 500;
    response.writeHead(status, { "content-type": "application/xml" });
    response.end(`<Error><Code>${status === 404 ? "NoSuchKey" : "InternalError"}</Code><Message>${xmlEscape(error instanceof Error ? error.message : "Local storage failure")}</Message></Error>`);
  }
});
server.listen(port, host, () => console.log(`Local object storage listening on http://${host}:${port}`));
