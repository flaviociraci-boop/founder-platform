// Generates favicon.ico, PWA icons, apple-touch-icon, and og-image from
// the source badge in public/connectyfind-logo-badge.png.
//
// Run with:  node scripts/generate-icons.mjs

import sharp from "sharp";
import pngToIco from "png-to-ico";
import fs from "node:fs/promises";

const src = "public/connectyfind-logo-badge.png";

await sharp(src).resize(192, 192).png().toFile("public/icon-192.png");
await sharp(src).resize(512, 512).png().toFile("public/icon-512.png");
await sharp(src).resize(180, 180).png().toFile("public/apple-touch-icon.png");

const buffers = await Promise.all(
  [16, 32, 48].map((s) => sharp(src).resize(s, s).png().toBuffer()),
);
await fs.writeFile("public/favicon.ico", await pngToIco(buffers));

await sharp({
  create: {
    width: 1200,
    height: 630,
    channels: 4,
    background: { r: 12, g: 7, b: 35, alpha: 1 }, // #0C0723
  },
})
  .composite([
    {
      input: await sharp(src).resize(500, 500).png().toBuffer(),
      gravity: "center",
    },
  ])
  .png()
  .toFile("public/og-image.png");

console.log("Generated:");
for (const f of ["favicon.ico", "icon-192.png", "icon-512.png", "apple-touch-icon.png", "og-image.png"]) {
  console.log(`  public/${f}`);
}
