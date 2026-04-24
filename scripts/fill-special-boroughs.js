const fs = require("fs");
const path = require("path");

function updateFile(relativePath, updater) {
  const filePath = path.join(process.cwd(), relativePath);

  if (!fs.existsSync(filePath)) {
    console.warn(`Missing file: ${filePath}`);
    return;
  }

  const records = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const updated = records.map(updater);

  fs.writeFileSync(filePath, `${JSON.stringify(updated, null, 2)}\n`);

  console.log(`Updated ${relativePath}: ${updated.length} records`);
}

updateFile("src/_data/unofficial/counterfeit.json", (record) => ({
  ...record,
  borough: "Manhattan"
}));

updateFile("src/_data/official/pp.json", (record) => ({
  ...record,
  borough: "Manhattan"
}));

updateFile("src/_data/official/tr.json", (record) => ({
  ...record,
  borough: "Queens"
}));

updateFile("src/_data/official/998.json", (record) => ({
  ...record,
  borough: "Manhattan"
}));

updateFile("src/_data/official/fantasy.json", (record) => ({
  ...record,
  borough: "Manhattan"
}));
