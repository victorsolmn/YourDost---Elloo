// Bundles src/ into one self-contained dist/index.html (CSS and JS inlined),
// so the same build runs on claude.ai, Vercel, Netlify or any static host.
import { build } from "esbuild";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const out = await build({
  entryPoints: ["src/main.js"], bundle: true, format: "iife", target: "es2019",
  write: false, outdir: "dist", minify: true, legalComments: "none",
});
const js = out.outputFiles.find((f) => f.path.endsWith(".js")).text;
const css = out.outputFiles.find((f) => f.path.endsWith(".css")).text;
const html = readFileSync("index.template.html", "utf8")
  .replace("/*__CSS__*/", () => css)
  .replace("/*__JS__*/", () => js.replace(/<\/script/gi, "<\\/script"));
mkdirSync("dist", { recursive: true });
writeFileSync("dist/index.html", html);
console.log(`dist/index.html ${(html.length / 1024).toFixed(1)} KB`);
