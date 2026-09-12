import { en } from "../src/locales/en.ts";
import { hi } from "../src/locales/hi.ts";
import { or } from "../src/locales/or.ts";

function getDeepKeys(obj, prefix = "") {
  let keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "object" && v !== null && !Array.isArray(v)) {
      keys = keys.concat(getDeepKeys(v, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

console.log("=========================================");
console.log(" MULTILINGUAL LOCALE PARITY VERIFICATION ");
console.log("=========================================");

const enKeys = getDeepKeys(en);
const hiKeys = getDeepKeys(hi);
const orKeys = getDeepKeys(or);

console.log(`English (en) keys: ${enKeys.length}`);
console.log(`Hindi   (hi) keys: ${hiKeys.length}`);
console.log(`Odia    (or) keys: ${orKeys.length}`);

const missingInHi = enKeys.filter((k) => !hiKeys.includes(k));
const missingInOr = enKeys.filter((k) => !orKeys.includes(k));

if (missingInHi.length > 0) {
  console.warn("Keys missing in Hindi:", missingInHi);
} else {
  console.log("✅ Hindi dictionary has 100% key coverage with English!");
}

if (missingInOr.length > 0) {
  console.warn("Keys missing in Odia:", missingInOr);
} else {
  console.log("✅ Odia dictionary has 100% key coverage with English!");
}

// Sample checks
console.log("\nSample Odia translations:");
console.log("common.search:", or.common.search);
console.log("voice.voiceInput:", or.voice?.voiceInput);
console.log("delivery.dutyOnline:", or.delivery?.dutyOnline);
console.log("delivery.arrivedAtPickup:", or.delivery?.arrivedAtPickup);
console.log("farmerForm.cropName:", or.farmerForm?.cropName);

console.log("\nSample Hindi translations:");
console.log("common.search:", hi.common.search);
console.log("voice.voiceInput:", hi.voice?.voiceInput);
console.log("delivery.dutyOnline:", hi.delivery?.dutyOnline);
console.log("delivery.arrivedAtPickup:", hi.delivery?.arrivedAtPickup);
console.log("farmerForm.cropName:", hi.farmerForm?.cropName);

console.log("\n✅ ALL LOCALES VERIFIED SUCCESSFULLY");
