import agentTrackingService from "./agentTracking.service.js";

class AgentTrackingController {
  async updateMyLocation(req, res, next) {
    try {
      const location =
        await agentTrackingService.updateAgentLocation(
          req.user.userId,
          req.body
        );

      return res.status(200).json({
        success: true,
        message: "Agent location updated successfully.",
        data: location,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyLocation(req, res, next) {
    try {
      const location =
        await agentTrackingService.getMyLocation(
          req.user.userId
        );

      return res.status(200).json({
        success: true,
        message: "Agent location fetched successfully.",
        data: location,
      });
    } catch (error) {
      next(error);
    }
  }

  async getOrderTracking(req, res, next) {
    try {
      const tracking =
        await agentTrackingService.getOrderTracking(
          req.params.id,
          req.user.userId,
          req.user.role
        );

      return res.status(200).json({
        success: true,
        message: "Order tracking fetched successfully.",
        data: tracking,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllActiveLocations(req, res, next) {
    try {
      const locations =
        await agentTrackingService.getAllActiveLocations();

      return res.status(200).json({
        success: true,
        message: "Active agent locations fetched successfully.",
        data: locations,
      });
    } catch (error) {
      next(error);
    }
  }

  async setMyLocationOffline(req, res, next) {
    try {
      const location =
        await agentTrackingService.setAgentOffline(
          req.user.userId
        );

      return res.status(200).json({
        success: true,
        message: "Agent location set to offline.",
        data: location,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AgentTrackingController();