export interface ModuleItem {
  id: string;
  number: string;
  title: string;
  status: "Published" | "Draft";
  description: string;
  included: {
    recordings: number;
    lessons: number;
    assignments: number;
    resources: number;
  };
}

export const modulesData: ModuleItem[] = [
  {
    id: "1",
    number: "01",
    title: "Introduction to Design",
    status: "Published",
    description:
      "Discover how product design turns user needs into useful, intuitive and meaningful experiences. Explore the core principles of colour, typography and layout, and learn how designers move from understanding a problem to developing a solution. Through real-world examples, see how thoughtful design improves everyday products and helps people achieve their goals.",
    included: {
      recordings: 1,
      lessons: 3,
      assignments: 1,
      resources: 1,
    },
  },
  {
    id: "2",
    number: "02",
    title: "User Research and Analysis",
    status: "Draft",
    description:
      "Learn methods for conducting qualitative and quantitative user research, synthesizing data, and building actionable user personas and journey maps.",
    included: {
      recordings: 2,
      lessons: 4,
      assignments: 2,
      resources: 3,
    },
  },
  {
    id: "3",
    number: "03",
    title: "Design Layout",
    status: "Draft",
    description:
      "Master grid systems, alignment, visual hierarchy, and whitespace to build harmonious and responsive screen layouts.",
    included: {
      recordings: 1,
      lessons: 3,
      assignments: 1,
      resources: 2,
    },
  },
  {
    id: "4",
    number: "04",
    title: "Figma Fundamentals",
    status: "Draft",
    description:
      "Get hands-on experience with Figma frames, auto layout, components, and variables to build professional digital wireframes.",
    included: {
      recordings: 3,
      lessons: 5,
      assignments: 2,
      resources: 4,
    },
  },
  {
    id: "5",
    number: "05",
    title: "Grid in Design",
    status: "Draft",
    description:
      "Explore structural column grids, modular layouts, and breakpoint management for complex web and mobile interfaces.",
    included: {
      recordings: 1,
      lessons: 2,
      assignments: 1,
      resources: 1,
    },
  },
  {
    id: "6",
    number: "06",
    title: "User journey Mapping",
    status: "Draft",
    description:
      "Map user actions, pain points, and emotional arcs across touchpoints to uncover product enhancement opportunities.",
    included: {
      recordings: 2,
      lessons: 3,
      assignments: 2,
      resources: 2,
    },
  },
];

export interface AssignmentItem {
  id: string;
  title: string;
  type: string;
  moduleNumber: string;
  moduleTitle: string;
  dueDate: string;
  dueRelative: string;
  submissions: {
    completed: number;
    total: number;
  };
  status: "Published" | "Draft";
}

export const assignmentsData: AssignmentItem[] = [
  {
    id: "1",
    title: "Visual Hierarchy",
    type: "Project · Individual",
    moduleNumber: "Module 1",
    moduleTitle: "Introduction to Design",
    dueDate: "Oct 12, 2026",
    dueRelative: "After lesson 3",
    submissions: {
      completed: 12,
      total: 16,
    },
    status: "Published",
  },
  {
    id: "2",
    title: "User Research Report",
    type: "Report · Individual",
    moduleNumber: "Module 2",
    moduleTitle: "User Research",
    dueDate: "Oct 21, 2026",
    dueRelative: "After lesson 4",
    submissions: {
      completed: 0,
      total: 16,
    },
    status: "Draft",
  },
  {
    id: "3",
    title: "Visual Hierarchy",
    type: "Project · Individual",
    moduleNumber: "Module 1",
    moduleTitle: "Introduction to Design",
    dueDate: "Oct 12, 2026",
    dueRelative: "After lesson 3",
    submissions: {
      completed: 0,
      total: 16,
    },
    status: "Draft",
  },
  {
    id: "4",
    title: "Visual Hierarchy",
    type: "Project · Individual",
    moduleNumber: "Module 1",
    moduleTitle: "Introduction to Design",
    dueDate: "Oct 12, 2026",
    dueRelative: "After lesson 3",
    submissions: {
      completed: 0,
      total: 16,
    },
    status: "Draft",
  },
];

export interface ResourceItem {
  id: string;
  name: string;
  moduleNumber: string;
  moduleTitle: string;
  uploaded: string;
  fileType: string;
  fileSize: string;
  status: "Published" | "Draft";
}

export const resourcesData: ResourceItem[] = [
  {
    id: "1",
    name: "Visual Hierarchy",
    moduleNumber: "Module 1",
    moduleTitle: "Introduction to Design",
    uploaded: "Oct 1, 2026",
    fileType: "PDF",
    fileSize: "1.2 MB",
    status: "Published",
  },
  {
    id: "2",
    name: "Lesson 1 Live class recording",
    moduleNumber: "Module 1",
    moduleTitle: "Introduction to Design",
    uploaded: "Oct 1, 2026",
    fileType: "Video",
    fileSize: "1.2 GB",
    status: "Published",
  },
  {
    id: "3",
    name: "Lesson 2 Live class recording",
    moduleNumber: "Module 1",
    moduleTitle: "Introduction to Design",
    uploaded: "Oct 5, 2026",
    fileType: "Video",
    fileSize: "1.2 GB",
    status: "Draft",
  },
  {
    id: "4",
    name: "Lesson 2 Live class recording",
    moduleNumber: "Module 1",
    moduleTitle: "Introduction to Design",
    uploaded: "Oct 5, 2026",
    fileType: "Document",
    fileSize: "880 KB",
    status: "Draft",
  },
];

export interface NoteItem {
  id: string;
  title: string;
  description: string;
  moduleNumber: string;
  date: string;
}

export const notesData: NoteItem[] = [
  {
    id: "1",
    title: "Visual Hierarchy",
    owner: "Aishat Lawal",
    moduleNumber: "Module 1",
    description: "Introduction to Design",
    date: "Oct 1, 2026",
  },
  {
    id: "2",
    title: "Lesson 1 Live class recording",
    owner: "Aishat Lawal",
    moduleNumber: "Module 1",
    description: "Introduction to Design",
    date: "Oct 1, 2026",
  },
  {
    id: "3",
    title: "Lesson 2 Live class recording",
    owner: "Aishat Lawal",
    moduleNumber: "Module 1",
    description: "Introduction to Design",
    date: "Oct 5, 2026",
  },
  {
    id: "4",
    title: "Lesson 2 Live class recording",
    owner: "Aishat Lawal",
    moduleNumber: "Module 1",
    description: "Introduction to Design",
    date: "Oct 5, 2026",
  },
];