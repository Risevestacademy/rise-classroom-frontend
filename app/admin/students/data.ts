export type StudentStatus = "Active" | "Pending" | "Suspended";

export type Student = {
  id: string;
  name: string;
  email: string;
  track: string;
  cohort: string;
  status: StudentStatus;
  joined: string;
  phone?: string;
  location?: string;
};

export const initialStudents: Student[] = [
  {
    id: "aishat-lawal",
    name: "Aishat Lawal",
    email: "aishatlawal21@gmail.com",
    track: "Backend",
    cohort: "Cohort 2026",
    status: "Active",
    joined: "Jan 9, 2026",
    phone: "+234 801 234 5678",
    location: "Abuja, Nigeria",
  },
  {
    id: "seyi-wakil",
    name: "Seyi Wakil",
    email: "seyiwawa543@gmail.com",
    track: "Design",
    cohort: "Cohort 2026",
    status: "Active",
    joined: "Jan 9, 2026",
    phone: "+234 234 434 0000",
    location: "Lagos, Nigeria",
  },
  {
    id: "adaeze-taiwo",
    name: "Adaeze Taiwo",
    email: "adaezetaiwo@gmail.com",
    track: "Mobile Engineering",
    cohort: "Cohort 2026",
    status: "Suspended",
    joined: "Jan 9, 2026",
  },
  {
    id: "kunle-adebayo",
    name: "Kunle Adebayo",
    email: "kunleadebayo@gmail.com",
    track: "Frontend",
    cohort: "Cohort 2026",
    status: "Pending",
    joined: "--",
  },
  {
    id: "zainab-musa",
    name: "Zainab Musa",
    email: "zainabmusa@gmail.com",
    track: "Backend",
    cohort: "Cohort 2026",
    status: "Active",
    joined: "Jan 9, 2026",
  },
  {
    id: "tunde-adeyemi",
    name: "Tunde Adeyemi",
    email: "tundeadeyemi@gmail.com",
    track: "Backend",
    cohort: "Cohort 2026",
    status: "Active",
    joined: "Feb 3, 2026",
  },
  {
    id: "fatima-bello",
    name: "Fatima Bello",
    email: "fatimabello@gmail.com",
    track: "Design",
    cohort: "Cohort 2026",
    status: "Pending",
    joined: "--",
  },
  {
    id: "chidi-okonkwo",
    name: "Chidi Okonkwo",
    email: "chidiokonkwo@gmail.com",
    track: "Frontend",
    cohort: "Cohort 2026",
    status: "Active",
    joined: "Mar 15, 2026",
  },
  {
    id: "amara-obi",
    name: "Amara Obi",
    email: "amaraobi@gmail.com",
    track: "Mobile Engineering",
    cohort: "Cohort 2026",
    status: "Active",
    joined: "Jan 20, 2026",
  },
  {
    id: "ruth-mensah",
    name: "Ruth Mensah",
    email: "ruthmensah@gmail.com",
    track: "Backend",
    cohort: "Cohort 2026",
    status: "Suspended",
    joined: "Feb 8, 2026",
  },
  {
    id: "daniel-nwosu",
    name: "Daniel Nwosu",
    email: "danielnwosu@gmail.com",
    track: "Design",
    cohort: "Cohort 2026",
    status: "Active",
    joined: "Mar 1, 2026",
  },
  {
    id: "emeka-nnamdi",
    name: "Emeka Nnamdi",
    email: "emekannamdi@gmail.com",
    track: "Frontend",
    cohort: "Cohort 2026",
    status: "Pending",
    joined: "--",
  },
  {
    id: "ngozi-eze",
    name: "Ngozi Eze",
    email: "ngozieze@gmail.com",
    track: "Design",
    cohort: "Cohort 2026",
    status: "Active",
    joined: "Feb 14, 2026",
  },
  {
    id: "yusuf-ibrahim",
    name: "Yusuf Ibrahim",
    email: "yusufibrahim@gmail.com",
    track: "Backend",
    cohort: "Cohort 2026",
    status: "Active",
    joined: "Mar 22, 2026",
  },
  {
    id: "adebola-okoro",
    name: "Adebola Okoro",
    email: "adebolaokoro@gmail.com",
    track: "Mobile Engineering",
    cohort: "Cohort 2026",
    status: "Active",
    joined: "Mar 22, 2026",
  },
];

export const statusBadge: Record<
  StudentStatus,
  "success" | "warning" | "error"
> = {
  Active: "success",
  Pending: "warning",
  Suspended: "error",
};
