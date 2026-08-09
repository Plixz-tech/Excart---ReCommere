import axios from "axios";
import ApiError from "../utils/errors/ApiError.js";
import { env } from "../config/env/index.js";

const GOOGLE_MAPS_API_KEY = env.GOOGLE_MAPS_API_KEY;

const geocodeClient = axios.create({
  baseURL: "https://maps.googleapis.com/maps/api",
  timeout: 10000,
});

export const getLocationByPincode = async (pincode) => {
  try {
    const { data } = await geocodeClient.get("/geocode/json", {
      params: {
        address: `${pincode}, India`,
        key: GOOGLE_MAPS_API_KEY,
      },
    });

    console.log("========== GOOGLE RESPONSE ==========");
    console.log(JSON.stringify(data, null, 2));
    console.log("=====================================");

    if (
      data.status !== "OK" ||
      !data.results ||
      data.results.length === 0
    ) {
throw new ApiError(
  404,
  `${data.status} - ${data.error_message || "No error message"}`
);
    }
console.log("Status:", data.status);
console.log("Error:", data.error_message);
console.log("Response:", data);
    const result = data.results[0];

    const addressComponents = result.address_components;

    const getComponent = (type) =>
      addressComponents.find((item) =>
        item.types.includes(type)
      )?.long_name || "";

    return {
      pincode,
      district: getComponent("administrative_area_level_2"),
      state: getComponent("administrative_area_level_1"),
      city:
        getComponent("locality") ||
        getComponent("administrative_area_level_3"),
      latitude: result.geometry.location.lat,
      longitude: result.geometry.location.lng,
      formattedAddress: result.formatted_address,
    };
  } catch (error) {
    console.error("GOOGLE ERROR:");
    console.error(error.response?.data || error);

    throw new ApiError(
      500,
      error.response?.data?.error_message ||
        error.message ||
        "Unable to fetch location."
    );
  }
};