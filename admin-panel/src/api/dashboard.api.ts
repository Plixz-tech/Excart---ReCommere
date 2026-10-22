import { api } from "./axios";

export interface DashboardOverview {
  totalOrders: number;
  activeAgents: number;
  pendingInspections: number;
  inventoryDevices: number;
  todayPickups: number;
}

export interface DashboardOrderPipeline {
  newOrders: number;
  scheduled: number;
  pickedUp: number;
  inspected: number;
  inTransit: number;
  readyStock: number;
}

export interface DashboardMetricComparison {
  current: number;
  previous: number;
  percentageChange: number | null;
}

export interface DashboardComparisons {
  totalOrders: DashboardMetricComparison;
  todayPickups: DashboardMetricComparison;
}

export interface DashboardPipelineChange {
  _id: string;
  count: number;
}

export interface DashboardAgentPerformance {
  agentId: string;
  fullName?: string;
  name?: string;
  assignedOrders: number;
  completedOrders: number;
  pickedUpOrders?: number;
}

export interface DashboardInspectionSummary {
  pending: number;
  inProgress: number;
  completed: number;
  passed: number;
  failed: number;
}

export interface DashboardPickupManagement {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
}

export interface DashboardInventory {
  in_inventory: number;
  listed: number;
  sold: number;
  [key: string]: unknown;
}

export interface DashboardData {
  overview: DashboardOverview;
  comparisons?: DashboardComparisons;
  orderPipeline: DashboardOrderPipeline;
  pipelineChanges?: DashboardPipelineChange[];
  recentOrders: Record<string, any>[];
  agentPerformance: DashboardAgentPerformance[];
  inspectionSummary: DashboardInspectionSummary;
  pickupManagement: DashboardPickupManagement;
  inventory: DashboardInventory;
  pendingPayments: Record<string, any>[];
  payments: Record<string, any>;
}

interface DashboardApiResponse {
  success: boolean;
  message: string;
  data: DashboardData;
}

export const getAdminDashboard = async (): Promise<DashboardData> => {
  const response = await api.get<DashboardApiResponse>(
    "/admin/dashboard",
  );

  return response.data.data;
};