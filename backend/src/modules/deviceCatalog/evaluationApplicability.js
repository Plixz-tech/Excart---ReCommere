const normalizeBrand = (value) => String(value ?? "").trim().toLowerCase();

export const isEvaluationSectionApplicable = ({
  sectionKey,
  brand,
  sectionConfig = {},
}) => {
  const supportedBrands = Array.isArray(sectionConfig.supportedBrands)
    ? sectionConfig.supportedBrands.filter(
        (item) => typeof item === "string" && item.trim().length > 0,
      )
    : [];

  if (supportedBrands.length === 0 || !String(brand ?? "").trim()) return true;

  const normalizedBrand = normalizeBrand(brand);
  return supportedBrands.some(
    (supportedBrand) => normalizeBrand(supportedBrand) === normalizedBrand,
  );
};

export const normalizeEvaluationConfigForBrand = (brand, evaluationConfig = {}) => {
  const normalized = { ...evaluationConfig };
  const batteryHealth = normalized.batteryHealth ?? {};
  const applicable = isEvaluationSectionApplicable({
    sectionKey: "batteryHealth",
    brand,
    sectionConfig: batteryHealth,
  });

  if (!applicable) {
    normalized.batteryHealth = {
      ...batteryHealth,
      enabled: false,
      options: [],
    };
  }

  return normalized;
};

export const filterDeductionsByBrand = (brand, deductions = [], evaluationConfig = {}) => {
  return (Array.isArray(deductions) ? deductions : []).filter((deduction) => {
    const sectionKey = String(deduction?.conditionType ?? "").trim();
    if (!sectionKey) return true;

    const sectionConfig = evaluationConfig?.[sectionKey] ?? {};
    return isEvaluationSectionApplicable({
      sectionKey,
      brand,
      sectionConfig,
    }) && sectionConfig.enabled !== false;
  });
};