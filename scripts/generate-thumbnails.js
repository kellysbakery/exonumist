const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const inputBaseDir = "src/assets/images/token";
const outputBaseDir = "src/assets/images/thumb";

const SIZE = 288;

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

if (!fs.existsSync(inputBaseDir)) {
  console.error(`Input folder not found: ${inputBaseDir}`);
  process.exit(1);
}

ensureDir(outputBaseDir);

const files = fs
  .readdirSync(inputBaseDir)
  .filter((file) => file.toLowerCase().endsWith(".png") || file.toLowerCase().endsWith(".jpg"))
  .sort();

(async () => {
  for (const file of files) {
    const inputPath = path.join(inputBaseDir, file);
    const ext = path.extname(file);
    const outputFile = file.replace(new RegExp(`${ext}$`, 'i'), ".webp");
    const outputPath = path.join(outputBaseDir, outputFile);

    console.log(`Creating thumbnail: ${outputFile}`);

    await sharp(inputPath)
      .resize(SIZE, SIZE, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .webp({ quality: 80 })
      .toFile(outputPath);
  }

  console.log(`Done. Created ${files.length} thumbnails.`);
})();