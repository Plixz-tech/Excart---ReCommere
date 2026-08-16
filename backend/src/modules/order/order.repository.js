import Order from "../../models/Order.js";

class OrderRepository {
    async create(orderData) {
        return Order.create(orderData);
    }

    async findById(orderId) {
        return Order.findById(orderId)
            .populate("customer", "fullName phone email")
            .populate(
                "agent",
                "fullName phone email agentProfile.agentId"
            )
            .populate("device")
            .populate("createdBy", "fullName email")
            .populate("updatedBy", "fullName email")
    }

    async findByOrderNumber(orderNumber) {
        return Order.findOne({ orderNumber });
    }

    async findAll(filter = {}, options = {}) {
        const {
            page = 1,
            limit = 10,
            sort = { createdAt: -1 },
        } = options;

        const skip = (page - 1) * limit;

        const [orders, total] = await Promise.all([
            Order.find(filter)
                .populate("customer", "fullName phone email")
                .populate(
                    "agent",
                    "fullName phone email agentProfile.agentId"
                )
                .populate("device")
                .sort(sort)
                .skip(skip)
                .limit(limit),

            Order.countDocuments(filter),
        ]);

        return {
            orders,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async updateById(orderId, updateData) {
        return Order.findByIdAndUpdate(
            orderId,
            updateData,
            {
                new: true,
                runValidators: true,
            }
        )
            .populate("customer", "fullName phone email")
            .populate(
                "agent",
                "fullName phone email agentProfile.agentId"
            )
            .populate("device");
    }

    async deleteById(orderId) {
        return Order.findByIdAndDelete(orderId);
    }

    async count(filter = {}) {
        return Order.countDocuments(filter);
    }
}

export default new OrderRepository();