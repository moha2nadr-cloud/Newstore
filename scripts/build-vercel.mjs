import { execSync } from "child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from "fs";
import { join, resolve } from "path";

const distClient = resolve("dist/client");

console.log("Building for Vercel...");
execSync("bun run build", { stdio: "inherit", env: { ...process.env, VERCEL: "0" } });

let htmlContent = null;

const possibleHtmlPaths = [
  join(distClient, "index.html"),
  join(resolve("dist"), "index.html"),
  join(resolve(".output"), "client", "index.html"),
  join(resolve(".output"), "public", "index.html"),
];

for (const p of possibleHtmlPaths) {
  if (existsSync(p)) {
    htmlContent = readFileSync(p, "utf-8");
    console.log(`Found index.html at: ${p}`);
    break;
  }
}

if (htmlContent) {
  if (!existsSync(distClient)) mkdirSync(distClient, { recursive: true });
  writeFileSync(join(distClient, "index.html"), htmlContent);
  console.log("Copied index.html → dist/client/");
} else {
  console.log("No index.html found, creating SPA shell from built assets...");
  const searchDirs = [distClient, resolve("dist")];
  let jsFiles = [];
  let cssFiles = [];

  for (const dir of searchDirs) {
    if (!existsSync(dir)) continue;
    const assetsDir = join(dir, "assets");
    if (existsSync(assetsDir)) {
      const files = readdirSync(assetsDir);
      for (const f of files) {
        if (f.endsWith(".js")) jsFiles.push(f);
        if (f.endsWith(".css")) cssFiles.push(f);
      }
      if (jsFiles.length > 0) {
        console.log(`Found ${jsFiles.length} JS and ${cssFiles.length} CSS assets in ${assetsDir}`);
        break;
      }
    }
  }

  const scripts = jsFiles.map((f) => `<script type="module" crossorigin src="./assets/${f}"></script>`).join("\n");
  const links = cssFiles.map((f) => `<link rel="stylesheet" crossorigin href="./assets/${f}" />`).join("\n");

  if (!existsSync(distClient)) mkdirSync(distClient, { recursive: true });
  writeFileSync(
    join(distClient, "index.html"),
    `<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <meta name="theme-color" content="#4a5d3a" />
    <title>الطب الإسلامي البديل</title>
    <link rel="icon" type="image/png" href="/favicon.png" />
    <link rel="apple-touch-icon" href="/app-icon.png" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Amiri+Quran&family=Tajawal:wght@300;400;500;700;800&display=swap" />
    ${links}
    <script>globalThis.__VERCEL__=true</script>
  </head>
  <body>
    <div id="root"></div>
    ${scripts}
  </body>
</html>`,
  );
  console.log("Created SPA shell at dist/client/index.html");
}

console.log("Vercel build complete.");
