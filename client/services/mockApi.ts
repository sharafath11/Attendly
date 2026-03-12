import axios from "axios";

const mockApi = axios.create({
  adapter: async (config) => {
    const data =
      config.url === "/dashboard/summary"
        ? {
            totalStudents: 186,
            todayAttendance: 142,
            pendingFees: 18,
            totalBatches: 12,
          }
        : {};

    return {
      data,
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    };
  },
});

export default mockApi;
