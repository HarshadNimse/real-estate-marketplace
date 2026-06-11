/**
 * Dev static server for frontend (port 5500).
 * Serves pages/, css/, and js/ so ../css and ../js links work from HTML pages.
 */
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.FRONTEND_PORT || 5500);
const FRONTEND = path.join(__dirname, "..", "frontend");

const MIME = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function resolveFile(urlPath) {
  const clean = urlPath.split("?")[0];
  if (clean === "/" || clean === "") {
    return path.join(FRONTEND, "pages", "index.html");
  }
  if (clean.startsWith("/css/")) {
    return path.join(FRONTEND, clean.slice(1));
  }
  if (clean.startsWith("/js/")) {
    return path.join(FRONTEND, clean.slice(1));
  }
  const base = path.basename(clean);
  if (base.endsWith(".html") || !path.extname(base)) {
    const name = base.endsWith(".html") ? base : `${base}.html`;
    return path.join(FRONTEND, "pages", name);
  }
  return path.join(FRONTEND, "pages", clean.replace(/^\//, ""));
}

http
  .createServer((req, res) => {
    const filePath = resolveFile(req.url || "/");
    if (!filePath.startsWith(FRONTEND)) {
      res.writeHead(403);
      return res.end("Forbidden");
    }
    fs.readFile(filePath, (err, data) => {
      if (err) {
        const notFound = path.join(FRONTEND, "pages", "404.html");
        return fs.readFile(notFound, (e2, page) => {
          res.writeHead(404, { "Content-Type": "text/html" });
          res.end(page || "Not found");
        });
      }
      res.writeHead(200, { "Content-Type": MIME[path.extname(filePath)] || "text/plain" });
      res.end(data);
    });
  })
  .listen(PORT, () => {
    console.log(`Frontend ready at http://localhost:${PORT}`);
    console.log("API should run separately on http://localhost:5000 (npm run dev)");
  });
