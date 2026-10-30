import { z } from "zod";

const httpsUrl = z
  .string()
  .trim()
  .min(1, "Link is required")
  .url("Enter a valid link")
  .refine((value) => value.startsWith("https://"), "Link must start with https://");

export const resourceFormSchema = z.object({
  serverId: z.string().optional(),
  title: z.string().trim().min(1, "Resource name is required"),
  url: httpsUrl,
});

export const lessonFormSchema = z.object({
  serverId: z.string().optional(),
  key: z.string(),
  title: z.string().trim().min(1, "Lesson title is required"),
  description: z.string().optional(),
  resources: z.array(resourceFormSchema),
});

export const assignmentFormSchema = z.object({
  serverId: z.string().optional(),
  title: z.string().trim().min(1, "Assignment title is required"),
  description: z.string().optional(),
  lessonKey: z.string(),
});

export const moduleFormSchema = z
  .object({
    title: z.string().trim().min(1, "Module title is required"),
    description: z.string().trim().min(1, "Description is required"),
    objectives: z.array(z.object({ value: z.string() })),
    recordingId: z.string().optional(),
    recordingLessonId: z.string().optional(),
    recordingUrl: z.union([z.literal(""), httpsUrl]),
    lessons: z.array(lessonFormSchema),
    assignments: z.array(assignmentFormSchema),
    publishStatus: z.enum(["DRAFT", "PUBLISHED"]),
  })
  .superRefine((values, ctx) => {
    const lessonKeys = new Set(values.lessons.map((lesson) => lesson.key));

    values.assignments.forEach((assignment, index) => {
      if (!assignment.lessonKey) return;

      if (!lessonKeys.has(assignment.lessonKey)) {
        ctx.addIssue({
          code: "custom",
          path: ["assignments", index, "lessonKey"],
          message: assignment.serverId
            ? "This assignment's lesson was removed. Remove the assignment too, or keep the lesson."
            : "Choose a lesson",
        });
      }
    });

    if (values.recordingUrl && values.lessons.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["recordingUrl"],
        message: "Add a lesson to attach the recording to",
      });
    }
  });

export type ModuleFormValues = z.infer<typeof moduleFormSchema>;

export const emptyModuleValues = (): ModuleFormValues => ({
  title: "",
  description: "",
  objectives: [{ value: "" }],
  recordingId: undefined,
  recordingLessonId: undefined,
  recordingUrl: "",
  lessons: [
    { key: "new-lesson-0", title: "", description: "", resources: [] },
  ],
  assignments: [],
  publishStatus: "DRAFT",
});

export const lessonItemSchema = z.object({
  topicId: z.string().min(1, "Choose a module"),
  title: lessonFormSchema.shape.title,
  description: z.string().optional(),
});
export type LessonItemValues = z.infer<typeof lessonItemSchema>;

export const resourceItemSchema = z.object({
  lessonId: z.string().min(1, "Choose a lesson"),
  title: resourceFormSchema.shape.title,
  url: resourceFormSchema.shape.url,
  description: z.string().optional(),
});
export type ResourceItemValues = z.infer<typeof resourceItemSchema>;

export const assignmentItemSchema = z.object({
  lessonId: z.string().min(1, "Choose a lesson"),
  title: assignmentFormSchema.shape.title,
  description: z.string().optional(),
});
export type AssignmentItemValues = z.infer<typeof assignmentItemSchema>;

const todayString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const assignmentPageSchema = assignmentItemSchema.extend({
  moduleId: z.string().min(1, "Choose a module"),
  lessonId: z.string(),
  description: z.string().trim().min(1, "Description is required"),
  instruction: z.string().optional(),
  resources: z.string().optional(),
  type: z.enum(["FILE_UPLOAD", "LINK", "TEXT"]),
  dueDate: z
    .string()
    .optional()
    .refine((value) => !value || value >= todayString(), "Due date can't be in the past"),
});
export type AssignmentPageValues = z.infer<typeof assignmentPageSchema>;

export const resourcePageSchema = resourceItemSchema.extend({
  moduleId: z.string().min(1, "Choose a module"),
  lessonId: z.string(),
  type: z.enum(["PDF", "VIDEO", "DOCUMENT", "IMAGE", "LINK"]),
});
export type ResourcePageValues = z.infer<typeof resourcePageSchema>;