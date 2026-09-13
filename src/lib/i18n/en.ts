const en: {
  nav: Record<
    | "dashboard"
    | "today"
    | "calendar"
    | "tasks"
    | "goals"
    | "habits"
    | "finance"
    | "wellness"
    | "journal"
    | "weeklyReview"
    | "analytics"
    | "assistant"
    | "relationships"
    | "integrations"
    | "settings"
    | "logout"
    | "more",
    string
  >;
  settings: {
    title: string;
    timezone: {
      heading: string;
      description: string;
      currentLabel: string;
      searchPlaceholder: string;
      browserSuggestion: string;
      use: string;
      dismiss: string;
      saving: string;
      saved: string;
    };
    currency: { heading: string; description: string };
    birthday: { heading: string; description: string };
    units: {
      heading: string;
      description: string;
      metric: { label: string; blurb: string };
      imperial: { label: string; blurb: string };
    };
    theme: {
      heading: string;
      description: string;
      light: { label: string; blurb: string };
      night: { label: string; blurb: string };
      calm: { label: string; blurb: string };
    };
    language: {
      heading: string;
      description: string;
      en: { label: string; blurb: string };
      es: { label: string; blurb: string };
    };
  };
  dashboard: Record<
    | "greetingMorning"
    | "greetingAfternoon"
    | "greetingEvening"
    | "hoursLeftToday"
    | "weather"
    | "addLocation"
    | "addOne"
    | "addCityPrompt"
    | "loadingWeather"
    | "todaysPriorities"
    | "selected"
    | "pickPriorities"
    | "taskList"
    | "addPriority"
    | "noMoreTasksToAdd"
    | "upcomingEvents"
    | "noEvents"
    | "upcomingDates"
    | "openCalendar"
    | "allDay"
    | "todaysTasks"
    | "allCaughtUp"
    | "viewAllTasks"
    | "habitTracker"
    | "noHabitsYet"
    | "manageHabits"
    | "yesterdaysWellness"
    | "noLogYesterday"
    | "logWellness"
    | "sleep"
    | "steps"
    | "exercise"
    | "energy"
    | "todaysJournal"
    | "notJournaledToday"
    | "openJournal"
    | "mood"
    | "yourBirthday",
    string
  >;
  pages: {
    calendar: {
      title: string;
      events: string;
      tasksDue: string;
      noEvents: string;
      noTasksDue: string;
      addEvent: string;
      viewAllTasks: string;
      close: string;
      allDay: string;
    };
    tasks: { title: string; addTask: string; empty: string };
    goals: { title: string; addGoal: string; empty: string };
    habits: { title: string; addHabit: string; empty: string };
    finance: { title: string };
    wellness: { title: string };
    journal: { title: string };
    weeklyReview: { title: string };
    analytics: { title: string; subtitle: string };
    assistant: { title: string; subtitle: string };
    relationships: { title: string; addContact: string; empty: string };
    integrations: { title: string; subtitle: string };
  };
} = {
  nav: {
    dashboard: "Dashboard",
    today: "Today",
    calendar: "Calendar",
    tasks: "Tasks",
    goals: "Goals & Vision",
    habits: "Habits",
    finance: "Finance",
    wellness: "Wellness & Health",
    journal: "Journal",
    weeklyReview: "Weekly Review",
    analytics: "Analytics",
    assistant: "Assistant",
    relationships: "Relationships",
    integrations: "Integrations",
    settings: "Settings",
    logout: "Log out",
    more: "More",
  },
  settings: {
    title: "Settings",
    timezone: {
      heading: "Timezone",
      description:
        'Used to figure out "today" for your tasks, habits, wellness and journal — so day boundaries match your local midnight, not the server\'s.',
      currentLabel: "Current timezone",
      searchPlaceholder: "Search timezones… (e.g. Mexico, London, Tokyo)",
      browserSuggestion: "Your browser looks like it's in",
      use: "Use",
      dismiss: "Dismiss",
      saving: "Saving…",
      saved: "Saved",
    },
    currency: {
      heading: "Currency",
      description: "Controls how money amounts are formatted across Finance and Analytics.",
    },
    birthday: {
      heading: "Birthday",
      description: "Set once, then shows up as a recurring yearly event on your Calendar and Dashboard.",
    },
    units: {
      heading: "Units",
      description: "Choose how weight and water intake are displayed in Wellness — applies instantly.",
      metric: { label: "Metric", blurb: "Kilograms (kg) and liters (L)." },
      imperial: { label: "Imperial", blurb: "Pounds (lb) and fluid ounces (fl oz)." },
    },
    theme: {
      heading: "Theme",
      description: "Pick a look — applies instantly, no need to reload.",
      light: { label: "Light", blurb: "Cream & sage — the original calm daytime look." },
      night: { label: "Night", blurb: "Dark background with a warm orange accent, easy on the eyes at night." },
      calm: { label: "Calm Blue", blurb: "A cool, soft blue palette for a quieter focus." },
    },
    language: {
      heading: "Language",
      description: "Choose the language for the app's interface — applies instantly, no need to reload.",
      en: { label: "English", blurb: "Interface text in English." },
      es: { label: "Español", blurb: "Textos de la interfaz en español." },
    },
  },
  dashboard: {
    greetingMorning: "Good morning",
    greetingAfternoon: "Good afternoon",
    greetingEvening: "Good evening",
    hoursLeftToday: "hours left today",
    weather: "Weather",
    addLocation: "Add a location",
    addOne: "Add one",
    addCityPrompt: "Add a city to see the forecast.",
    loadingWeather: "Loading weather...",
    todaysPriorities: "Today's Priorities",
    selected: "selected",
    pickPriorities: "Pick up to 3 priorities from your",
    taskList: "task list",
    addPriority: "Tap a task to add it as a priority",
    noMoreTasksToAdd: "No more open tasks to add — create one on the",
    upcomingEvents: "Upcoming Events",
    noEvents: "No events scheduled. Nice and clear.",
    upcomingDates: "Upcoming dates",
    openCalendar: "Open calendar",
    allDay: "All day",
    todaysTasks: "Today's Tasks",
    allCaughtUp: "All caught up.",
    viewAllTasks: "View all tasks",
    habitTracker: "Habit Tracker",
    noHabitsYet: "No habits yet.",
    manageHabits: "Manage habits",
    yesterdaysWellness: "Yesterday's Wellness",
    noLogYesterday: "No log for yesterday.",
    logWellness: "Log wellness",
    sleep: "Sleep",
    steps: "Steps",
    exercise: "Exercise",
    energy: "Energy",
    todaysJournal: "Today's Journal",
    notJournaledToday: "You haven't journaled today.",
    openJournal: "Open journal",
    mood: "Mood",
    yourBirthday: "🎂 Your Birthday",
  },
  pages: {
    calendar: {
      title: "Calendar",
      events: "Events",
      tasksDue: "Tasks due",
      noEvents: "No events.",
      noTasksDue: "No tasks due.",
      addEvent: "Add event",
      viewAllTasks: "View all tasks",
      close: "Close",
      allDay: "All day",
    },
    tasks: { title: "Tasks", addTask: "Add task", empty: "No tasks yet." },
    goals: { title: "Goals & Vision", addGoal: "Add goal", empty: "No goals yet." },
    habits: { title: "Habits", addHabit: "Add habit", empty: "No habits yet." },
    finance: { title: "Finance" },
    wellness: { title: "Wellness & Health" },
    journal: { title: "Journal" },
    weeklyReview: { title: "Weekly Review" },
    analytics: {
      title: "Analytics",
      subtitle: "Trends and honest observations across your habits, tasks, wellness, finances, and journal.",
    },
    assistant: {
      title: "Assistant",
      subtitle: "Ask about your day, your goals, or get a suggested plan — grounded in your real data.",
    },
    relationships: { title: "Relationships", addContact: "Add contact", empty: "No contacts yet." },
    integrations: {
      title: "Integrations",
      subtitle: "Connect outside data sources to Life OS. Real connections are coming — Relationships already works today.",
    },
  },
};

export default en;
