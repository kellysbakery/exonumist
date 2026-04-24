const fs = require("fs");
const path = require("path");

const updates = {
  "628.json": "Bronx",
  "629.json": "Brooklyn",
  "630.json": "Manhattan",
  "631.json": "Queens",
  "632.json": "Staten Island"
};

const dataDir = path.join(process.cwd(), "src", "_data", "official");

for (const [fileName, borough] of Object.entries(updates)) {
  const filePath = path.join(dataDir, fileName);

  if (!fs.existsSync(filePath)) {
    console.warn(`Missing file: ${filePath}`);
    continue;
  }

  const records = JSON.parse(fs.readFileSync(filePath, "utf8"));

  const updated = records.map((record) => ({
    ...record,
    borough
  }));

  fs.writeFileSync(filePath, `${JSON.stringify(updated, null, 2)}\n`);

  console.log(`Updated ${fileName}: ${updated.length} records set to ${borough}`);
}
