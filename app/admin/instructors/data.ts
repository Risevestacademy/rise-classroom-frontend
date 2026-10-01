export type Instructor = {
  id: string;
  name: string;
  email: string;
  track: string;
  cohort: string;
  status: "Active" | "Pending";
  joined: string;
};
