import fs from "fs";
import path from "path";

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      if (file !== "node_modules" && file !== ".next") {
        walk(path.join(dir, file), fileList);
      }
    } else if (file.endsWith(".tsx")) {
      fileList.push(path.join(dir, file));
    }
  }
  return fileList;
}

const files = walk("d:/sih2026/src");

// Patterns to look for in JSX:
// {something.destination}
// {something.pickupLocation}
// {something.location}
// {destination}
// {pickupLocation}
for (const file of files) {
  const content = fs.readFileSync(file, "utf-8");
  const lines = content.split("\n");
  lines.forEach((line, idx) => {
    if (
      line.includes("destination}") ||
      line.includes("destination }") ||
      line.includes("pickupLocation}") ||
      line.includes("pickupLocation }") ||
      line.includes(".destination}") ||
      line.includes(".pickupLocation}") ||
      line.includes(".pickup}") ||
      line.includes("deliveryAddress}") ||
      line.includes(".deliveryAddress}") ||
      line.includes(".deliveryHub}") ||
      line.includes("deliveryHub}")
    ) {
      console.log(`${file}:${idx + 1}: ${line.trim()}`);
    }
  });
}
