import api from "./axios";

const financeApi = {
  // POST /api/finance/process-bill/
  processBill: (payload) =>
    api.post("/finance/process-bill/", payload).then((res) => res.data),

  // GET /api/finance/journal-entries/?source_type=...
  getJournalEntries: (params = {}) =>
    api.get("/finance/journal-entries/", { params }).then((res) => res.data),

  // GET /api/finance/income-report/
  getIncomeReport: () =>
    api.get("/finance/income-report/").then((res) => res.data),
};

export default financeApi;
