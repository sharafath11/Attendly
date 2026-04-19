/** Sample data for the Parent Portal preview until backend APIs exist. */

export const demoParent = {
  centerName: "Bright Minds Tuition",
  childName: "Aanya Sharma",
  classLabel: "Grade 10 · Evening batch",
};

export const demoAttendance = [
  { date: "Apr 18, 2026", status: "present" as const },
  { date: "Apr 17, 2026", status: "present" as const },
  { date: "Apr 16, 2026", status: "absent" as const },
  { date: "Apr 15, 2026", status: "present" as const },
];

export const demoFees = {
  monthlyAmount: 4500,
  paidThrough: "April 2026",
  nextDue: "May 1, 2026",
  status: "paid" as const,
};

export const demoPerformance = {
  attendanceRate: 88,
  note: "Strong consistency this month. One absence on Apr 16.",
};

export const demoUpdates = [
  {
    id: "1",
    title: "Fee reminder",
    body: "May fee will be due on May 1. Pay early to avoid late fee.",
    time: "Today · 9:00 AM",
    kind: "fee" as const,
  },
  {
    id: "2",
    title: "Attendance",
    body: "Aanya was marked present for today’s session.",
    time: "Today · 6:30 PM",
    kind: "attendance" as const,
  },
  {
    id: "3",
    title: "Holiday notice",
    body: "Center closed on Apr 21 for local holiday.",
    time: "Yesterday",
    kind: "broadcast" as const,
  },
];
