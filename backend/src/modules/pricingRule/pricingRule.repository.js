import PricingRule from "../../models/PricingRule.js";

// GET ACTIVE RULES

export const findActive = async () => {
  return PricingRule.find({
    active: true,
  }).sort({
    createdAt: 1,
  });
};


// GET RULE BY ID

export const findById = async (
  pricingRuleId
) => {
  return PricingRule.findById(
    pricingRuleId
  );
};


// CREATE PRICING RULE

export const create = async (data) => {
  return PricingRule.create(data);
};


// UPDATE PRICING RULE

export const updateById = async (
  pricingRuleId,
  data
) => {
  return PricingRule.findByIdAndUpdate(
    pricingRuleId,
    data,
    {
      new: true,
      runValidators: true,
    }
  );
};


// DELETE PRICING RULE

export const deleteById = async (
  pricingRuleId
) => {
  return PricingRule.findByIdAndDelete(
    pricingRuleId
  );
};