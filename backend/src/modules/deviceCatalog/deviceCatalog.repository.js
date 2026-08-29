import DeviceCatalog from "../../models/DeviceCatalog.js";

// CREATE

export const create = async (data) => {
  return DeviceCatalog.create(data);
};

// GET ACTIVE CATALOG

export const findActive = async () => {
  return DeviceCatalog.find({
    active: true,
  }).sort({
    brand: 1,
    model: 1,
    variant: 1,
  });
};

// GET ALL CATALOG

export const findAll = async () => {
  return DeviceCatalog.find()
    .sort({
      brand: 1,
      model: 1,
      variant: 1,
    });
};

// GET BY ID

export const findById = async (id) => {
  return DeviceCatalog.findById(id);
};

// FIND SPECIFIC VARIANT

export const findMatching = async ({
  brand,
  model,
  variant,
}) => {
  return DeviceCatalog.findOne({
    brand,
    model,
    variant: variant || "",
    active: true,
  });
};

// UPDATE

export const updateById = async (id, data) => {
  return DeviceCatalog.findByIdAndUpdate(
    id,
    data,
    {
      new: true,
      runValidators: true,
    }
  );
};

// DELETE

export const deleteById = async (id) => {
  return DeviceCatalog.findByIdAndDelete(id);
};