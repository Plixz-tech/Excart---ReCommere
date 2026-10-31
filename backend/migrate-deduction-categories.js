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
  );

  const plans = [];

  for (const catalog of catalogs) {
    const deductions = catalog.conditionDeductions ?? [];
    const allUncategorized = deductions.every(
      (item) => !item.conditionType
    );

    if (!allUncategorized) {
      throw new Error(
        `Catalog ${catalog._id} has already categorized or mixed deductions. Aborting.`
      );
    }

    const config =
      catalog.evaluationConfig?.toObject?.() ??
      catalog.evaluationConfig ??
      {};

    let offset = 0;
    const mapped = [];

    for (const category of categoryOrder) {
      const options = config[category]?.options ?? [];
      const items = deductions.slice(offset, offset + options.length);

      if (
        items.length !== options.length ||
        !items.every((item, index) => item.name === options[index])
      ) {
        throw new Error(
          `Category mapping mismatch for catalog ${catalog._id}, category ${category}. Aborting.`
        );
      }

      for (const item of items) {
        mapped.push({
          conditionType: category,
          name: item.name,
          amount: item.amount,
          active: item.active ?? true,
        });
      }

      offset += options.length;
    }

    if (offset !== deductions.length) {
      throw new Error(
        `Unmapped deductions found for catalog ${catalog._id}. Aborting.`
      );
    }

    plans.push({ catalog, mapped });
  }

  console.log("Migration validation passed.");
  console.log(`Catalogs ready: ${plans.length}`);
  console.log(
    `Deductions ready: ${plans.reduce((sum, plan) => sum + plan.mapped.length, 0)}`
  );
  console.log("No database records were modified.");
} catch (error) {
  console.error("Migration validation failed:", error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
