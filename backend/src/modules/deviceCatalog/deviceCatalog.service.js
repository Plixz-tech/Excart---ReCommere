
import mongoose from "mongoose";
import ApiError from "../../utils/errors/ApiError.js";
import * as deviceCatalogRepository from "./deviceCatalog.repository.js";
import DeviceCatalog from "../../models/DeviceCatalog.js";
import {
  filterDeductionsByBrand,
  normalizeEvaluationConfigForBrand,
} from "./evaluationApplicability.js";

// CREATE

export const createDeviceCatalog = async (
  data,
  userId
) => {
  if (!data.brand) {
    throw new ApiError(
      400,
      "Brand is required."
    );
  }

  if (!data.model) {
    throw new ApiError(
      400,
      "Model is required."
    );
  }

  if (
    data.valuationPrice === undefined ||
    data.valuationPrice === null
  ) {
    throw new ApiError(
      400,
      "Valuation price is required."
    );
  }

  if (Number(data.valuationPrice) < 0) {
    throw new ApiError(
      400,
      "Valuation price cannot be negative."
    );
  }

  if (
    data.agentCommission !== undefined &&
    Number(data.agentCommission) < 0
  ) {
    throw new ApiError(
      400,
      "Agent commission cannot be negative."
    );
  }

  const brand = data.brand.trim();
  const evaluationConfig = normalizeEvaluationConfigForBrand(
    brand,
    data.evaluationConfig ?? {},
  );
  const conditionDeductions = filterDeductionsByBrand(
    brand,
    data.conditionDeductions ?? [],
    evaluationConfig,
  );

  return deviceCatalogRepository.create({
    brand,

    brandImage:
      data.brandImage?.trim() || "",

    model: data.model.trim(),

    modelImage:
      data.modelImage?.trim() || "",

    variant:
      data.variant?.trim() || "",

    storage:
      data.storage?.trim() || "",

    ram:
      data.ram?.trim() || "",

    valuationPrice:
      Number(data.valuationPrice),

    agentCommission:
      Number(data.agentCommission ?? 0),

    // CONDITION DEDUCTIONS
    conditionDeductions: conditionDeductions.map((deduction) => ({
      conditionType: deduction.conditionType.trim(),
      name: deduction.name.trim(),
      amount: Number(deduction.amount),
      active: deduction.active ?? true,
    })),

    // EVALUATION CONFIGURATION
    evaluationConfig: {
      screenCondition: evaluationConfig.screenCondition,
      displayIssues: evaluationConfig.displayIssues,
      bodyCondition: evaluationConfig.bodyCondition,
      batteryHealth: evaluationConfig.batteryHealth,
      repairHistory: evaluationConfig.repairHistory,
      accessories: evaluationConfig.accessories,
      functionalChecks: evaluationConfig.functionalChecks,
      supportedBrands: evaluationConfig.supportedBrands,
      // BACKWARD COMPATIBILITY
      battery: evaluationConfig.battery ?? "none",
      biometric: evaluationConfig.biometric ?? "none",
    },

    active:
      data.active !== undefined
        ? data.active
        : true,

    createdBy: userId || null,

    updatedBy: userId || null,
  });
};


// GET ACTIVE CATALOG

export const getActiveDeviceCatalog =
  async () => {
    return deviceCatalogRepository.findActive();
  };

// GET DEFAULT EVALUATION CONFIGURATION

export const getDefaultDeviceCatalogEvaluation = async () => {
  const evaluationConfig = new DeviceCatalog().evaluationConfig;

  const config =
    evaluationConfig?.toObject?.() ??
    evaluationConfig?.toJSON?.() ??
    evaluationConfig ??
    {};

  const sections = [
    {
      key: "screenCondition",
      title: "Screen Condition",
      type: "single_select",
      ...(config.screenCondition ?? {}),
    },
    {
      key: "displayIssues",
      title: "Display Issues",
      type: "multi_select",
      ...(config.displayIssues ?? {}),
    },
    {
      key: "bodyCondition",
      title: "Body Condition",
      type: "single_select",
      ...(config.bodyCondition ?? {}),
    },
    {
      key: "batteryHealth",
      title: "Battery Health",
      type: "single_select",
      ...(config.batteryHealth ?? {}),
    },
    {
      key: "repairHistory",
      title: "Repair / Refurbished",
      type: "single_select",
      ...(config.repairHistory ?? {}),
    },
    {
      key: "accessories",
      title: "Accessories",
      type: "multi_select",
      ...(config.accessories ?? {}),
    },
    {
      key: "functionalChecks",
      title: "Functional Checks",
      type: "functional_checks",
      ...(config.functionalChecks ?? {}),
    },
  ]
    .filter((section) => section.enabled !== false)
    .map(({ key, ...section }) => ({
      key,
      ...section,
    }));

  return { sections };
};

export const getDeviceCatalogEvaluation = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid device catalog ID.");
  }

  const catalog = await deviceCatalogRepository.findById(id);

  if (!catalog) {
    throw new ApiError(404, "Device catalog not found.");
  }

  const storedEvaluationConfig =
    catalog.evaluationConfig?.toObject?.() ??
    catalog.evaluationConfig?.toJSON?.() ??
    catalog.evaluationConfig ??
    {};
  const evaluationConfig = normalizeEvaluationConfigForBrand(
    catalog.brand,
    storedEvaluationConfig,
  );

  const sections = [
    {
      key: "screenCondition",
      title: "Screen Condition",
      type: "single_select",
      ...(evaluationConfig.screenCondition ?? {}),
    },
    {
      key: "displayIssues",
      title: "Display Issues",
      type: "multi_select",
      ...(evaluationConfig.displayIssues ?? {}),
    },
    {
      key: "bodyCondition",
      title: "Body Condition",
      type: "single_select",
      ...(evaluationConfig.bodyCondition ?? {}),
    },
    {
      key: "batteryHealth",
      title: "Battery Health",
      type: "single_select",
      ...(evaluationConfig.batteryHealth ?? {}),
    },
    {
      key: "repairHistory",
      title: "Repair / Refurbished",
      type: "single_select",
      ...(evaluationConfig.repairHistory ?? {}),
    },
    {
      key: "accessories",
      title: "Accessories",
      type: "multi_select",
      ...(evaluationConfig.accessories ?? {}),
    },
    {
      key: "functionalChecks",
      title: "Functional Checks",
      type: "functional_checks",
      ...(evaluationConfig.functionalChecks ?? {}),
    },
  ]
    .filter((section) => section.enabled !== false)
    .map(({ key, ...section }) => ({
      key,
      ...section,
    }));

  return {
    deviceCatalogId: catalog._id,
    brand: catalog.brand,
    model: catalog.model,
    variant: catalog.variant,
    sections,
  };
};



// GET ALL CATALOG

export const getAllDeviceCatalog =
  async () => {
    return deviceCatalogRepository.findAll();
  };

// GET BY ID

export const getDeviceCatalogById =
  async (id) => {
    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      throw new ApiError(
        400,
        "Invalid device catalog ID."
      );
    }

    const catalog =
      await deviceCatalogRepository.findById(
        id
      );

    if (!catalog) {
      throw new ApiError(
        404,
        "Device catalog not found."
      );
    }

    return catalog;
  };

// FIND MATCHING CATALOG

export const findMatchingDeviceCatalog =
  async ({
    brand,
    model,
    variant,
  }) => {
    if (!brand || !model) {
      throw new ApiError(
        400,
        "Brand and model are required."
      );
    }

    const catalog =
      await deviceCatalogRepository.findMatching(
        {
          brand,
          model,
          variant,
        }
      );

    if (!catalog) {
      throw new ApiError(
        404,
        "Matching device catalog not found."
      );
    }

    return catalog;
  };

// UPDATE


export const updateDeviceCatalog = async (
  id,
  data,
  userId
) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(
      400,
      "Invalid device catalog ID."
    );
  }

  const existing =
    await deviceCatalogRepository.findById(id);

  if (!existing) {
    throw new ApiError(
      404,
      "Device catalog not found."
    );
  }

  const updateData = {
    updatedBy: userId || null,
  };

  if (data.brand !== undefined) {
    updateData.brand = data.brand.trim();
  }

  if (data.brandImage !== undefined) {
    updateData.brandImage = data.brandImage.trim();
  }

  if (data.model !== undefined) {
    updateData.model = data.model.trim();
  }

  if (data.modelImage !== undefined) {
    updateData.modelImage = data.modelImage.trim();
  }

  if (data.variant !== undefined) {
    updateData.variant = data.variant.trim();
  }

  if (data.storage !== undefined) {
    updateData.storage = data.storage.trim();
  }

  if (data.ram !== undefined) {
    updateData.ram = data.ram.trim();
  }

  if (data.valuationPrice !== undefined) {
    if (Number(data.valuationPrice) < 0) {
      throw new ApiError(
        400,
        "Valuation price cannot be negative."
      );
    }

    updateData.valuationPrice =
      Number(data.valuationPrice);
  }

  if (data.agentCommission !== undefined) {
    if (Number(data.agentCommission) < 0) {
      throw new ApiError(
        400,
        "Agent commission cannot be negative."
      );
    }

    updateData.agentCommission =
      Number(data.agentCommission);
  }

// UPDATE CONDITION DEDUCTIONS
if (data.conditionDeductions !== undefined) {
  updateData.conditionDeductions =
    data.conditionDeductions.map((deduction) => ({
      conditionType: deduction.conditionType.trim(),
      name: deduction.name.trim(),
      amount: Number(deduction.amount),
      active: deduction.active ?? true,
    }));
}

  // MERGE EVALUATION CONFIGURATION
  if (data.evaluationConfig !== undefined) {
    const currentConfig =
      existing.evaluationConfig?.toObject?.() ??
      existing.evaluationConfig?.toJSON?.() ??
      existing.evaluationConfig ??
      {};

    const incomingConfig = data.evaluationConfig;

    const sectionNames = [
      "screenCondition",
      "displayIssues",
      "bodyCondition",
      "batteryHealth",
      "repairHistory",
      "accessories",
      "functionalChecks",
    ];

    const mergedConfig = {
      ...currentConfig,
      ...incomingConfig,
    };

    for (const sectionName of sectionNames) {
      if (incomingConfig[sectionName] !== undefined) {
        mergedConfig[sectionName] = {
          ...(currentConfig[sectionName] ?? {}),
          ...incomingConfig[sectionName],
        };
      }
    }

    mergedConfig.battery =
      incomingConfig.battery ??
      currentConfig.battery ??
      "none";

    mergedConfig.biometric =
      incomingConfig.biometric ??
      currentConfig.biometric ??
      "none";

    updateData.evaluationConfig = mergedConfig;
  }

  if (data.active !== undefined) {
    updateData.active = data.active;
  }

  const effectiveBrand = updateData.brand ?? existing.brand;
  const currentEvaluationConfig =
    updateData.evaluationConfig ??
    existing.evaluationConfig?.toObject?.() ??
    existing.evaluationConfig?.toJSON?.() ??
    existing.evaluationConfig ??
    {};
  const normalizedEvaluationConfig = normalizeEvaluationConfigForBrand(
    effectiveBrand,
    currentEvaluationConfig,
  );

  // Persist the disabled state for sections that do not apply to this brand.
  updateData.evaluationConfig = normalizedEvaluationConfig;

  // Never retain or reactivate deductions for sections that are inapplicable
  // to the catalog brand, including when an existing Apple catalog is changed
  // to a non-Apple brand.
  if (data.conditionDeductions !== undefined || data.brand !== undefined) {
    const sourceDeductions =
      updateData.conditionDeductions ?? existing.conditionDeductions ?? [];
    updateData.conditionDeductions = filterDeductionsByBrand(
      effectiveBrand,
      sourceDeductions,
      normalizedEvaluationConfig,
    ).map((deduction) => ({
      conditionType: deduction.conditionType?.trim() || undefined,
      name: deduction.name.trim(),
      amount: Number(deduction.amount),
      active: deduction.active ?? true,
    }));
  }

  return deviceCatalogRepository.updateById(
    id,
    updateData
  );
};


// DELETE

export const deleteDeviceCatalog =
  async (id) => {
    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      throw new ApiError(
        400,
        "Invalid device catalog ID."
      );
    }

    const existing =
      await deviceCatalogRepository.findById(
        id
      );

    if (!existing) {
      throw new ApiError(
        404,
        "Device catalog not found."
      );
    }

    await deviceCatalogRepository.deleteById(
      id
    );

    return {
      message:
        "Device catalog deleted successfully.",
    };
  };