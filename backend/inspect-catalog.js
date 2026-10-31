import mongoose from "mongoose";
import { env } from "./src/config/env/index.js";
import DeviceCatalog from "./src/models/DeviceCatalog.js";

try {
  await mongoose.connect(env.MONGO_URI);

  const catalogs = await DeviceCatalog.find(
    {},
    {
      brand: 1,
      model: 1,
      variant: 1,
      valuationPrice: 1,
      evaluationConfig: 1,
      conditionDeductions: 1,
    }
  ).lean();

  console.log(
    JSON.stringify(
      catalogs.map((catalog) => ({
        _id: catalog._id,
        brand: catalog.brand,
        model: catalog.model,
        variant: catalog.variant,
        valuationPrice: catalog.valuationPrice,
        evaluationConfig: catalog.evaluationConfig,
        conditionDeductions: catalog.conditionDeductions,
      })),
      null,
      2
    )
  );
} catch (error) {
  console.error("Catalog inspection failed:", error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
