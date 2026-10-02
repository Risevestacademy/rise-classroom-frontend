"use client";

import * as React from "react";

import { initialStudents, type Student } from "./data";

type NewStudent = Omit<Student, "id">;

type StudentsContextValue = {
  students: Student[];
  addStudents: (students: NewStudent[]) => void;
};

const StudentsContext = React.createContext<StudentsContextValue | null>(null);

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function createUniqueId(student: NewStudent, takenIds: Set<string>) {
  const baseId = slugify(student.name || student.email) || "student";
  let id = baseId;
  let suffix = 2;

  while (takenIds.has(id)) {
    id = `${baseId}-${suffix}`;
    suffix += 1;
  }

  return id;
}

export function StudentsProvider({ children }: { children: React.ReactNode }) {
  const [students, setStudents] = React.useState<Student[]>(initialStudents);

  const addStudents = React.useCallback((newStudents: NewStudent[]) => {
    setStudents((current) => {
      const takenIds = new Set(current.map((student) => student.id));

      const added = newStudents.map((student) => {
        const id = createUniqueId(student, takenIds);
        takenIds.add(id);
        return { ...student, id };
      });

      return [...current, ...added];
    });
  }, []);

  return (
    <StudentsContext.Provider value={{ students, addStudents }}>
      {children}
    </StudentsContext.Provider>
  );
}

export function useStudents() {
  const context = React.useContext(StudentsContext);
  if (!context) {
    throw new Error("useStudents must be used within StudentsProvider");
  }
  return context;
}
