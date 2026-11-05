import type { TimelineGroup } from "@/components/student-profile/shared";
import { shortDate } from "@/lib/calendar";
import type { Academy, AcademyStatus } from "@/lib/platform";


const showSampleData = process.env.NODE_ENV === "development";

export type OnboardingRequestStatus = "NEW" | "PENDING";

export type OnboardingRequest = {
  id: string;
  academy: string;
  submittedAt: string;
  status: OnboardingRequestStatus;
};

export const onboardingRequests: OnboardingRequest[] = showSampleData
  ? [
      { id: "1", academy: "Dogg Inc", submittedAt: "2026-10-27T09:00:00.000Z", status: "NEW" },
      { id: "2", academy: "Bright Future Academy", submittedAt: "2026-10-27T09:00:00.000Z", status: "NEW" },
      { id: "3", academy: "Codehub", submittedAt: "2026-10-21T09:00:00.000Z", status: "PENDING" },
      { id: "4", academy: "Dezignn House", submittedAt: "2026-10-21T09:00:00.000Z", status: "PENDING" },
    ]
  : [];

function sampleAcademy(
  id: string,
  name: string,
  createdAt: string,
  [firstName, lastName]: [string, string],
  onboardingStatus: "INVITED" | "COMPLETED",
  status: AcademyStatus = "ACTIVE",
): Academy {
  return {
    id,
    name,
    slug: id,
    status,
    createdAt,
    updatedAt: createdAt,
    counts: { users: 0, cohorts: 0, tracks: 0 },
    admins: [
      {
        id: `admin-${id}`,
        email: `${firstName.toLowerCase()}@example.com`,
        firstName,
        lastName,
        status: "ACTIVE",
        onboardingStatus,
      },
    ],
  };
}


export const platformAcademies: Academy[] = showSampleData
  ? [
      sampleAcademy("pixel", "Pixel Academy", "2026-10-02T09:00:00.000Z", ["Ngozi", "Eze"], "INVITED"),
      sampleAcademy("learners", "Learners Hub", "2026-10-02T09:00:00.000Z", ["Sade", "Bello"], "INVITED"),
      sampleAcademy("bright", "Bright Future Academy", "2026-10-02T09:00:00.000Z", ["Kofi", "Mensah"], "INVITED"),
      sampleAcademy("freecode", "Freecodecamp", "2026-10-02T09:00:00.000Z", ["Amina", "Musa"], "INVITED"),
      sampleAcademy("design", "Design Lab Academy", "2026-10-01T09:00:00.000Z", ["James", "Okafor"], "COMPLETED"),
      sampleAcademy("codehub", "Codehub Academy", "2026-09-20T09:00:00.000Z", ["Ada", "Obi"], "COMPLETED"),
      sampleAcademy("rise", "Rise Academy", "2026-09-01T09:00:00.000Z", ["John", "John"], "COMPLETED"),
    ]
  : [];

export const platformActivity: TimelineGroup[] = showSampleData
  ? [
      {
        label: `Today - ${shortDate(new Date())}`,
        items: [
          {
            time: "10:24 AM",
            title: "New application received",
            detail: "Dogg Inc submitted an application.",
          },
          {
            time: "09:14 AM",
            title: "Academy account activated",
            detail: "Design Lab Academy completed its setup.",
          },
        ],
      },
    ]
  : [];
