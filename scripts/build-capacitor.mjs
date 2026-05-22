import { execSync } from "child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from "fs";
import { join, resolve } from "path";

const distClient = resolve("dist/client");
const outDir = resolve(".output");

console.log("Building for Capacitor...");
execSync("bun run build", { stdio: "inherit", env: { ...process.env, CAPACITOR_BUILD: "1" } });

let htmlContent = null;
let htmlSource = null;

const possibleHtmlPaths = [
  [join(distClient, "index.html"), "dist/client/"],
  [join(outDir, "client", "index.html"), ".output/client/"],
  [join(outDir, "public", "index.html"), ".output/public/"],
  [join(resolve("dist"), "index.html"), "dist/"],
];

for (const [p, label] of possibleHtmlPaths) {
  if (existsSync(p)) {
    htmlContent = readFileSync(p, "utf-8");
    htmlSource = label;
    console.log(`Found index.html at: ${p}`);
    break;
  }
}

if (htmlContent && htmlSource !== "dist/client/") {
  if (!existsSync(distClient)) mkdirSync(distClient, { recursive: true });
  writeFileSync(join(distClient, "index.html"), htmlContent);
  console.log("Copied index.html → dist/client/");
} else if (!htmlContent) {
  console.log("No index.html found in build output, creating minimal one...");
  const searchDirs = [distClient, resolve("dist")];
  let jsFiles = [];
  let cssFiles = [];

  for (const dir of searchDirs) {
    const assetsDir = join(dir, "assets");
    if (existsSync(assetsDir)) {
      const files = readdirSync(assetsDir);
      for (const f of files) {
        if (f.endsWith(".js")) jsFiles.push(f);
        if (f.endsWith(".css")) cssFiles.push(f);
      }
      if (jsFiles.length > 0) break;
    }
  }

  const scripts = jsFiles.map((f) => `<script type="module" src="./assets/${f}"></script>`).join("\n");
  const links = cssFiles.map((f) => `<link rel="stylesheet" href="./assets/${f}" />`).join("\n");

  if (!existsSync(distClient)) mkdirSync(distClient, { recursive: true });
  writeFileSync(
    join(distClient, "index.html"),
    `<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <title>الطب الإسلامي البديل</title>
    <link rel="icon" type="image/png" href="/favicon.png" />
    ${links}
  </head>
  <body>
    <div id="root"></div>
    ${scripts}
  </body>
</html>`,
  );
  console.log("Created minimal index.html in dist/client/");
}

console.log("Capacitor build complete.");
