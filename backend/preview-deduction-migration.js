import mongoose from "mongoose";
import { env } from "./src/config/env/index.js";
import DeviceCatalog from "./src/models/DeviceCatalog.js";

const categoryOrder = [
  "screenCondition",
  "displayIssues",
  "bodyCondition",
  "batteryHealth",
  "repairHistory",
  "accessories",
  "functionalChecks",
];

try {
  await mongoose.connect(env.MONGO_URI);

  const catalogs = await DeviceCatalog.find(
    { "conditionDeductions.0": { $exists: true } },
    {
      brand: 1,
      model: 1,
      variant: 1,
      evaluationConfig: 1,
      conditionDeductions: 1,
    }
  ).lean();

  for (const catalog of catalogs) {
    const deductions = catalog.conditionDeductions ?? [];
    const allUncategorized = deductions.every(
      (item) => !item.conditionType
    );

    let offset = 0;
    const preview = [];
    let valid = allUncategorized;

    for (const key of categoryOrder) {
      const options =
        catalog.evaluationConfig?.[key]?.options ?? [];

      const items = deductions.slice(offset, offset + options.length);
      offset += options.length;

      const namesMatch =
        items.length === options.length &&
        items.every((item, index) => item.name === options[index]);

      if (!namesMatch) valid = false;

      preview.push({
        category: key,
        optionCount: options.length,
        namesMatch,
      });
    }

    if (offset !== deductions.length) valid = false;

    console.log(JSON.stringify({
      catalog: `${catalog.brand} ${catalog.model} ${catalog.variant || ""}`.trim(),
      deductionCount: deductions.length,
      allUncategorized,
      mappingValid: valid,
      categories: preview,
    }, null, 2));
  }
} catch (error) {
  console.error("Preview failed:", error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
