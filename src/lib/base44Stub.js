const makeStore = (key) => {
  const read = () => {
    try {
      return JSON.parse(localStorage.getItem(key) || "[]");
    } catch {
      return [];
    }
  };

  const write = (data) => {
    localStorage.setItem(key, JSON.stringify(data));
    return data;
  };

  return {
    list: async () => read(),
    create: async (data) => {
      const items = read();
      const item = {
        id: crypto.randomUUID(),
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
        ...data,
      };
      write([item, ...items]);
      return item;
    },
    update: async (id, data) => {
      const items = read().map((item) =>
        item.id === id
          ? { ...item, ...data, updated_date: new Date().toISOString() }
          : item
      );
      write(items);
      return items.find((item) => item.id === id);
    },
    delete: async (id) => {
      const items = read().filter((item) => item.id !== id);
      write(items);
      return { success: true };
    },
  };
};

export const base44 = {
  entities: {
    Job: makeStore("stub_jobs"),
    Candidate: makeStore("stub_candidates"),
    Submission: makeStore("stub_submissions"),
    Interview: makeStore("stub_interviews"),
    Placement: makeStore("stub_placements"),
    Client: makeStore("stub_clients"),
    Contact: makeStore("stub_contacts"),
    Activity: makeStore("stub_activities"),
    Timesheet: makeStore("stub_timesheets"),
    Expense: makeStore("stub_expenses"),
    Contract: makeStore("stub_contracts"),
    Onboarding: makeStore("stub_onboarding"),
    Payroll: makeStore("stub_payroll"),
    User: makeStore("stub_users"),
    DashboardPreference: makeStore("stub_dashboard_preferences"),
    ATSColumnConfig: makeStore("stub_ats_column_configs"),
    AccessRequest: makeStore("stub_access_requests"),
  },
};