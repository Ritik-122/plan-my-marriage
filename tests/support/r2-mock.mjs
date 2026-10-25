import { createServer } from "node:http";
import { createHash } from "node:crypto";

// Isolated HTTP fixture for the actual S3 adapter. It does not validate AWS signatures
// and cannot establish compatibility with a real R2 account or its CORS settings.
export async function startR2Fixture() {
  const objects = new Map();
  let failDelete = false;
  const server = createServer(async (request, response) => {
    const path = decodeURIComponent(
      new URL(request.url, "http://localhost").pathname,
    );
    response.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:3111");
    response.setHeader(
      "Access-Control-Allow-Methods",
      "PUT, GET, HEAD, DELETE, OPTIONS",
    );
    response.setHeader(
      "Access-Control-Allow-Headers",
      "content-type, if-none-match",
    );
    if (request.method === "OPTIONS") {
      response.writeHead(204).end();
      return;
    }
    if (path === "/__test/fail-delete" && request.method === "POST") {
      failDelete = true;
      response.writeHead(204).end();
      return;
    }
    const key = path.replace(/^\/(pmm-test|media)\//, "");
    const error = (status, code) => {
      response
        .writeHead(status, { "Content-Type": "application/xml" })
        .end(`<Error><Code>${code}</Code></Error>`);
    };
    if (request.method === "PUT") {
      if (request.headers["x-amz-copy-source"]) {
        const source = objects.get(
          decodeURIComponent(request.headers["x-amz-copy-source"]).replace(
            /^\/?pmm-test\//,
            "",
          ),
        );
        if (!source) {
          error(404, "NoSuchKey");
          return;
        }
        if (request.headers["x-amz-copy-source-if-match"] !== source.etag) {
          error(412, "PreconditionFailed");
          return;
        }
        objects.set(key, { ...source });
        response
          .writeHead(200, { "Content-Type": "application/xml" })
          .end(
            `<CopyObjectResult><LastModified>${new Date().toISOString()}</LastModified><ETag>${source.etag}</ETag></CopyObjectResult>`,
          );
        return;
      }
      if (request.headers["if-none-match"] !== "*" || objects.has(key)) {
        error(412, "PreconditionFailed");
        return;
      }
      const chunks = [];
      for await (const chunk of request) chunks.push(chunk);
      const bytes = Buffer.concat(chunks);
      const etag = `"${createHash("md5").update(bytes).digest("hex")}"`;
      objects.set(key, { bytes, etag, type: request.headers["content-type"] });
      response.writeHead(200, { ETag: etag }).end();
      return;
    }
    if (request.method === "DELETE") {
      if (failDelete) {
        failDelete = false;
        error(503, "ServiceUnavailable");
        return;
      }
      objects.delete(key);
      response.writeHead(204).end();
      return;
    }
    const object = objects.get(key);
    if (!object) {
      error(404, "NoSuchKey");
      return;
    }
    if (
      request.headers["if-match"] &&
      request.headers["if-match"] !== object.etag
    ) {
      error(412, "PreconditionFailed");
      return;
    }
    const bytes = request.headers.range
      ? object.bytes.subarray(0, 32)
      : object.bytes;
    response.writeHead(request.headers.range ? 206 : 200, {
      "Content-Type": object.type,
      "Content-Length":
        request.method === "HEAD" ? object.bytes.length : bytes.length,
      ETag: object.etag,
      "Cache-Control": "no-store",
    });
    response.end(request.method === "HEAD" ? undefined : bytes);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}
