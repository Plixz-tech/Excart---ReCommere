
import OrderEvaluation from "../../models/OrderEvaluation.js";

const create = async (data) => {
  return OrderEvaluation.create(data);
};

const findById = async (evaluationId, session = null) => {
  let query = OrderEvaluation.findById(evaluationId)
    .select("+guestTokenHash");

  if (session) {
    query = query.session(session);
  }

  return query;
};

const findByIdAndCustomer = async (
  evaluationId,
  customerId,
  session = null
) => {
  let query = OrderEvaluation.findOne({
    _id: evaluationId,
    customer: customerId,
  });

  if (session) {
    query = query.session(session);
  }

  return query;
};

const updateById = async (
  evaluationId,
  updateData,
  session = null
) => {
  const options = {
    new: true,
    runValidators: true,
  };

  if (session) {
    options.session = session;
  }

  return OrderEvaluation.findByIdAndUpdate(
    evaluationId,
    { $set: updateData },
    options
  );
};

// CONFIRM EVALUATION ONLY IF IT HAS NOT ALREADY BEEN CONFIRMED.
const confirmIfPriced = async (
  evaluationId,
  customerId,
  orderId,
  session
) => {
  return OrderEvaluation.findOneAndUpdate(
    {
      _id: evaluationId,
      customer: customerId,
      status: "priced",
      orderId: null,
      expiresAt: { $gt: new Date() },
    },
    {
      $set: {
        status: "confirmed",
        orderId,
      },
    },
    {
      new: true,
      runValidators: true,
      session,
    }
  );
};

const deleteById = async (evaluationId) => {
  return OrderEvaluation.findByIdAndDelete(evaluationId);
};

export default {
  create,
  findById,
  findByIdAndCustomer,
  updateById,
  confirmIfPriced,
  deleteById,
};
