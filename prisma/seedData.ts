import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

function daysAgo(n: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

function atHour(base: Date, hour: number, minute = 0) {
  const d = new Date(base);
  d.setHours(hour, minute, 0, 0);
  return d;
}

export async function runSeed(prisma: PrismaClient) {
  const email = "demo@lifeos.app";
  const passwordHash = await bcrypt.hash("demo1234", 10);

  await prisma.user.deleteMany({ where: { email } });

  const user = await prisma.user.create({
    data: {
      email,
      name: "Demo User",
      passwordHash,
      timezone: "America/Mexico_City",
      currency: "MXN",
      theme: "light",
      locale: "es",
    },
  });

  const today = daysAgo(0);

  // Goals + Objectives
  const goal = await prisma.goal.create({
    data: {
      userId: user.id,
      title: "Get healthier this year",
      vision: "Feel strong, sleep well, and have consistent energy.",
      description: "Build sustainable habits around movement, food, and sleep.",
      objectives: {
        create: [
          { title: "Exercise 4x per week", description: "Mix of strength and cardio" },
          { title: "Sleep 7.5+ hours nightly" },
        ],
      },
    },
    include: { objectives: true },
  });

  const goal2 = await prisma.goal.create({
    data: {
      userId: user.id,
      title: "Launch side project",
      vision: "Ship something small and useful every month.",
      objectives: { create: [{ title: "Finish MVP" }] },
    },
    include: { objectives: true },
  });

  // Tasks
  await prisma.task.createMany({
    data: [
      { userId: user.id, title: "Morning workout", dueDate: today, priority: 1, goalId: goal.id },
      { userId: user.id, title: "Grocery shopping", dueDate: today, priority: 2 },
      { userId: user.id, title: "Write project README", dueDate: today, priority: 1, goalId: goal2.id },
      { userId: user.id, title: "Call dentist", dueDate: daysAgo(-1), priority: 3 },
      { userId: user.id, title: "Review budget", dueDate: today, priority: 2 },
      { userId: user.id, title: "Meditate 10 min", dueDate: today, priority: 3, completed: true, completedAt: new Date() },
    ],
  });

  // Events
  await prisma.event.createMany({
    data: [
      {
        userId: user.id,
        title: "Team standup",
        startsAt: atHour(today, 9, 0),
        endsAt: atHour(today, 9, 30),
      },
      {
        userId: user.id,
        title: "Gym session",
        startsAt: atHour(today, 18, 0),
        endsAt: atHour(today, 19, 0),
        location: "Local gym",
      },
      {
        userId: user.id,
        title: "Dentist appointment",
        startsAt: atHour(daysAgo(-2), 14, 0),
        endsAt: atHour(daysAgo(-2), 15, 0),
      },
    ],
  });

  // Habits + logs
  const habitNames = ["Drink 8 glasses of water", "Read 20 minutes", "No phone after 10pm"];
  for (const name of habitNames) {
    const habit = await prisma.habit.create({
      data: { userId: user.id, name, frequency: "DAILY" },
    });
    const logs = [];
    for (let i = 0; i < 10; i++) {
      if (Math.random() > 0.3) {
        logs.push({ habitId: habit.id, date: daysAgo(i), completed: true });
      }
    }
    if (logs.length) await prisma.habitLog.createMany({ data: logs });
  }

  // Wellness logs
  const wellnessData = [];
  for (let i = 0; i < 14; i++) {
    wellnessData.push({
      userId: user.id,
      date: daysAgo(i),
      sleepHours: 6 + Math.random() * 2,
      weight: 165 + Math.random(),
      steps: Math.floor(4000 + Math.random() * 6000),
      exerciseMinutes: Math.floor(Math.random() * 60),
      waterOz: 40 + Math.random() * 40,
      energy: Math.floor(4 + Math.random() * 6),
      stress: Math.floor(2 + Math.random() * 6),
    });
  }
  await prisma.wellnessLog.createMany({ data: wellnessData });

  // Finance
  const checking = await prisma.financeAccount.create({
    data: { userId: user.id, name: "Main Checking", type: "checking", balance: 3200 },
  });
  const savings = await prisma.financeAccount.create({
    data: { userId: user.id, name: "Savings", type: "savings", balance: 12000 },
  });

  await prisma.transaction.createMany({
    data: [
      { userId: user.id, accountId: checking.id, amount: 4500, category: "Salary", date: daysAgo(5), isIncome: true },
      { userId: user.id, accountId: checking.id, amount: 120, category: "Groceries", date: daysAgo(3), isIncome: false },
      { userId: user.id, accountId: checking.id, amount: 60, category: "Dining", date: daysAgo(2), isIncome: false },
      { userId: user.id, accountId: checking.id, amount: 1500, category: "Rent", date: daysAgo(1), isIncome: false },
      { userId: user.id, accountId: savings.id, amount: 500, category: "Transfer", date: daysAgo(4), isIncome: true },
    ],
  });

  await prisma.budget.createMany({
    data: [
      { userId: user.id, category: "Groceries", monthlyLimit: 500, month: new Date().toISOString().slice(0, 7) },
      { userId: user.id, category: "Dining", monthlyLimit: 200, month: new Date().toISOString().slice(0, 7) },
    ],
  });

  // Journal entries
  const journalData = [];
  for (let i = 0; i < 7; i++) {
    journalData.push({
      userId: user.id,
      date: daysAgo(i),
      mood: Math.floor(2 + Math.random() * 4),
      energy: Math.floor(4 + Math.random() * 6),
      stress: Math.floor(2 + Math.random() * 6),
      text: i === 0 ? "Feeling good about progress on the side project today." : null,
    });
  }
  await prisma.journalEntry.createMany({ data: journalData });

  // Weekly review
  await prisma.weeklyReview.create({
    data: {
      userId: user.id,
      weekStart: daysAgo(7),
      tasksCompleted: 14,
      habitsPercent: 78,
      financeSummary: { spent: 1680, saved: 500 },
      wellnessSummary: { avgSleep: 7.1, avgSteps: 6500 },
      goalsProgress: { "Get healthier this year": 40, "Launch side project": 20 },
      wentWell: "Stuck to the workout schedule and slept better.",
      improve: "Spent too much on dining out.",
      nextPriority: "Finish MVP objective for the side project.",
    },
  });

  // Relationships (V4)
  await prisma.contact.create({
    data: {
      userId: user.id,
      name: "Maria Gonzalez",
      relationship: "Sister",
      notes: "Lives in Austin, loves hiking.",
      importantDates: {
        create: [{ label: "Birthday", date: new Date(new Date().getFullYear(), 9, 12), recurring: true }],
      },
    },
  });
  await prisma.contact.create({
    data: {
      userId: user.id,
      name: "Sam Patel",
      relationship: "Best friend",
      importantDates: {
        create: [{ label: "Anniversary of friendship", date: new Date(new Date().getFullYear(), 5, 1), recurring: true }],
      },
    },
  });

  // Weather locations (V5)
  await prisma.weatherLocation.createMany({
    data: [
      { userId: user.id, name: "Ciudad de México", latitude: 19.4326, longitude: -99.1332, order: 0 },
      { userId: user.id, name: "Madrid", latitude: 40.4168, longitude: -3.7038, order: 1 },
    ],
  });

  return { email, password: "demo1234" };
}
