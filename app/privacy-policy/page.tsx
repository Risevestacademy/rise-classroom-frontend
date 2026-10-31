import type { Metadata } from "next";
import type { ReactNode } from "react";

import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";
import { LegalContents } from "@/components/landing/LegalContents";
import { LandingMotion } from "@/components/landing/motion/LandingMotion";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Rise Classroom collects, uses, shares and protects personal information, and the rights you have over it.",
  alternates: { canonical: "/privacy-policy" },
};

const updatedOn = "October 29, 2026";
const contactEmail = "contact@riseclassroom.com";

function P({ children }: { children: ReactNode }) {
  return <p>{children}</p>;
}

/* A paragraph that opens with a bold italic label, as in "Account Information:". */
function Labelled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <p>
      <strong className="font-semibold italic">{label}:</strong> {children}
    </p>
  );
}

function List({ items }: { items: ReactNode[] }) {
  return (
    <ul className="flex list-disc flex-col gap-2 pl-6 marker:text-text-muted">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

const sections: { id: string; title: string; body: ReactNode }[] = [
  {
    id: "introduction",
    title: "Introduction",
    body: (
      <>
        <P>Welcome to Rise Classroom.</P>
        <P>
          Rise Classroom (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or
          &ldquo;us&rdquo;) is a learning management platform that enables
          students, instructors, mentors, and educational organizations to
          manage learning activities, collaborate, and monitor learning
          progress.
        </P>
        <P>
          This Privacy Policy explains how we collect, use, disclose, and
          otherwise process personal information when you access or use Rise
          Classroom and its related services. It also describes the choices
          available to you and the rights you may have concerning your personal
          information under applicable data protection laws.
        </P>
        <P>
          This policy applies to individuals who use Rise Classroom, including
          students, instructors, mentors, and representatives of educational
          organizations. We encourage you to read it carefully to
          understand how your personal information is handled.
        </P>
      </>
    ),
  },
  {
    id: "information-we-collect",
    title: "Information we collect",
    body: (
      <>
        <P>
          The information we collect depends on how you use Rise Classroom and
          the features you access. This may include the following categories of
          information:
        </P>
        <Labelled label="Account Information">
          When you create an account or are invited to join Rise Classroom, we
          may collect information such as your name, email address, account
          credentials, and role on the platform. If you join through an
          educational organization, we may also process information about your
          organization, program, cohort, or learning track.
        </Labelled>
        <Labelled label="Learning and Academic Information">
          When you participate in learning activities, we may process
          information related to your educational experience, including
          assignment submissions, assessment results, learning progress,
          completed activities, and performance indicators.
        </Labelled>
        <Labelled label="Communication and Feedback">
          When you use communication or feedback features, we may collect the
          information you provide, such as feedback submissions, comments,
          mentor meeting notes, and messages or other content submitted through
          the platform.
        </Labelled>
        <Labelled label="Usage and Activity Information">
          We may collect information about your interactions with Rise
          Classroom, including the learning materials you access, activities
          you complete, and features you use. The specific usage information
          collected depends on the platform&apos;s implementation.
        </Labelled>
        <Labelled label="Information Provided by Organizations">
          If you access Rise Classroom through an educational organization, we
          may receive information about you from that organization, such as
          account invitations, enrollment details, assigned roles, and program
          or cohort membership.
        </Labelled>
      </>
    ),
  },
  {
    id: "how-we-use-your-information",
    title: "How we use your information",
    body: (
      <>
        <P>
          Rise Classroom uses personal information to support learning
          activities, manage educational programs, and improve the experience
          of using the platform. Depending on how you use the platform, your
          information may be used for the following purposes.
        </P>
        <Labelled label="Account Management">
          To create and manage accounts, verify user identities where required,
          assign roles, and provide access to the appropriate programs and
          features.
        </Labelled>
        <Labelled label="Learning and Program Delivery">
          To provide learning materials, manage curriculum content, facilitate
          assignments, and support communication between students,
          instructors, and mentors.
        </Labelled>
        <Labelled label="Progress Monitoring">
          To track learning activities, display progress indicators, assess
          performance against established learning standards, and help
          instructors and authorized administrators identify students who may
          need additional support.
        </Labelled>
        <Labelled label="Communication and Support">
          To facilitate relevant educational communications, respond to
          enquiries, address technical issues, and manage feedback submitted
          through the platform.
        </Labelled>
        <Labelled label="Platform Administration">
          To manage educational organizations, programs, cohorts, user access,
          and other administrative activities necessary to operate Rise
          Classroom.
        </Labelled>
        <Labelled label="Platform Improvement">
          To understand how the platform is used, identify usability issues,
          and improve its features and functionality, where the necessary
          information is available and its use is permitted by applicable law.
        </Labelled>
      </>
    ),
  },
  {
    id: "learning-and-performance-data",
    title: "Learning and performance data",
    body: (
      <>
        <P>
          Rise Classroom supports learning and progress monitoring by providing
          tools for managing educational activities and tracking student
          performance. Depending on the features used, information associated
          with a student&apos;s learning experience may be processed for the
          following purposes.
        </P>
        <Labelled label="Learning Records">
          We may process information about your participation in educational
          programs, including curriculum activities, accessed learning
          materials, assignment submissions, assessment results, and completed
          learning activities.
        </Labelled>
        <Labelled label="Progress and Performance Monitoring">
          The platform may use learning records and performance indicators to
          display progress, measure performance against established learning
          standards, and help instructors assess learning outcomes.
        </Labelled>
        <Labelled label="Cohort Monitoring">
          Where these features are available, authorized personnel may access
          aggregated or individual learning progress information to monitor
          cohort performance, identify students who may need additional
          support, and assess progress across educational programs.
        </Labelled>
        <Labelled label="Instructor and Mentor Support">
          Learning and performance information may be made available to
          authorized instructors, mentors, and administrators to support
          feedback, mentoring, academic guidance, and appropriate learning
          interventions.
        </Labelled>
        <Labelled label="Access to Learning Records">
          Access to learning and performance information should be limited
          according to each user&apos;s role and responsibilities within Rise
          Classroom. The information available to each role depends on the
          platform&apos;s access permissions and the educational
          organization&apos;s configuration.
        </Labelled>
      </>
    ),
  },
  {
    id: "how-we-share-your-information",
    title: "How we share your information",
    body: (
      <>
        <P>
          Rise Classroom may share personal information when necessary to
          provide its services, support educational activities, and meet
          applicable legal obligations. Information is shared only for
          appropriate purposes and subject to applicable data protection
          requirements.
        </P>
        <Labelled label="Educational Organizations">
          If you use Rise Classroom through an educational organization,
          relevant information about your account, learning activities, and
          progress may be accessible to authorized representatives of that
          organization for educational and administrative purposes.
        </Labelled>
        <Labelled label="Instructors and mentors">
          Information relevant to your learning activities and progress may be
          made available to your assigned instructors and mentors to support
          teaching, assessment, feedback, and mentoring.
        </Labelled>
        <Labelled label="Authorized platform personnel">
          Authorized personnel may access personal information when necessary
          to administer accounts, manage educational programs, provide support,
          and maintain the platform. Access should be governed by role-based
          permissions and legitimate operational needs.
        </Labelled>
        <Labelled label="Service providers">
          Rise Classroom may rely on third-party service providers to support
          its operations, such as hosting, account authentication,
          communications, or technical infrastructure. Where such providers
          process personal information on our behalf, appropriate safeguards
          and contractual arrangements should be established as required by
          applicable law.
        </Labelled>
        <Labelled label="Legal Requirements">
          We may disclose personal information where required by applicable
          law, a valid legal process, or a lawful request from a competent
          authority.
        </Labelled>
        <Labelled label="Other circumstances">
          If Rise Classroom undergoes a business restructuring, merger, or
          transfer of its operations, personal information may be involved in
          that process, subject to applicable legal requirements and
          appropriate safeguards.
        </Labelled>
      </>
    ),
  },
  {
    id: "cookies-and-analytics",
    title: "Cookies and Analytics",
    body: (
      <>
        <P>
          Rise Classroom may use cookies and similar technologies to support
          the operation of the platform, remember preferences, maintain
          sessions, and understand how users interact with its services.
        </P>
        {/* The design labels these two "Educational Organizations" and
            "Instructors and mentors", copied from the sharing section, and
            repeats that section's remaining paragraphs here. The labels below
            match what the paragraphs describe; the repeats are left out. */}
        <Labelled label="Essential Cookies">
          Certain cookies or similar technologies may be necessary for core
          platform functions, such as account authentication, session
          management, and security.
        </Labelled>
        <Labelled label="Analytics">
          If analytics tools are used, they may help us understand how the
          platform is used, identify technical issues, and improve its features
          and performance.
        </Labelled>
      </>
    ),
  },
  {
    id: "storage-and-security",
    title: "Storage and security",
    body: (
      <>
        <P>
          We store your information with trusted cloud hosting providers and
          use technical and organizational measures to protect it, including
          encrypted connections, secure session cookies, and access controls
          that limit each role to the information it needs.
        </P>
        <P>
          No method of transmitting or storing information is completely
          secure. If we become aware of a security incident that affects your
          personal information, we will notify you and the relevant
          authorities as required by law.
        </P>
      </>
    ),
  },
  {
    id: "data-retention",
    title: "Data retention",
    body: (
      <>
        <P>
          We keep your personal information for as long as your account is
          active or as needed to provide Rise Classroom to you and your
          organization.
        </P>
        <P>
          When an account is closed, or when your organization asks us to, we
          delete or anonymize the information within a reasonable period,
          unless we need to keep it to meet legal obligations, resolve
          disputes, or enforce our agreements.
        </P>
      </>
    ),
  },
  {
    id: "your-privacy-rights",
    title: "Your privacy rights",
    body: (
      <>
        <P>
          Depending on where you live, you may have the right to:
        </P>
        <List
          items={[
            "Access the personal information we hold about you.",
            "Correct information that is inaccurate or incomplete.",
            "Ask us to delete your personal information.",
            "Object to or restrict certain processing.",
            "Receive a copy of your information in a portable format.",
            "Withdraw consent where we rely on it.",
          ]}
        />
        <P>
          To exercise these rights, contact us using the details below. If you
          joined through an educational organization, we may refer your request
          to them, as they decide how your learning information is used. You
          also have the right to complain to your local data protection
          authority.
        </P>
      </>
    ),
  },
  {
    id: "international-data-transfers",
    title: "International data transfers",
    body: (
      <P>
        Our service providers may store and process your information in
        countries other than the one you live in, where data protection laws
        may differ. When we transfer information across borders, we take steps
        to make sure it remains protected in line with this policy and
        applicable law.
      </P>
    ),
  },
  {
    id: "changes-to-this-policy",
    title: "Changes to this policy",
    body: (
      <P>
        We may update this Privacy Policy from time to time. When we do, we
        will change the &ldquo;Updated&rdquo; date at the top of this page. If
        the changes are significant, we will let you know by email or through a
        notice on the platform before they take effect.
      </P>
    ),
  },
  {
    id: "contact-us",
    title: "Contact Us",
    body: (
      <P>
        If you have questions about this Privacy Policy or how we handle your
        personal information, email us at{" "}
        <a
          href={`mailto:${contactEmail}`}
          className="font-medium text-text-brand underline underline-offset-2"
        >
          {contactEmail}
        </a>
        .
      </P>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <>
      <LandingNav intro={false} />
      {/* Same reveal as the home page: main lifts away to show the footer. */}
      <main
        data-landing-main
        className="relative z-10 overflow-clip rounded-b-[40px] bg-white"
      >
        <div className="mx-auto w-full max-w-[1440px] px-4 pt-[72px] pb-24 lg:grid lg:grid-cols-[328px_minmax(0,1fr)] lg:px-8 lg:pt-[100px] lg:pb-32">
          <div aria-hidden className="hidden border-r border-neutral-200 lg:block" />
          <header className="pt-12 pb-12 lg:pt-[72px] lg:pb-14 lg:pl-4">
            <h1 className="text-[36px] leading-[1.15] font-medium tracking-[-0.02em] text-text-primary lg:text-[44px]">
              Privacy Policy
            </h1>
            <p className="mt-4 text-[16px] leading-6 text-text-secondary">
              Updated {updatedOn}
            </p>
          </header>

          <aside className="hidden border-r border-neutral-200 lg:block">
            <div className="sticky top-24">
              <LegalContents
                sections={sections.map(({ id, title }) => ({ id, title }))}
              />
            </div>
          </aside>

          <div className="max-w-[760px] lg:pl-4">
            {sections.map((section, index) => (
              <section
                key={section.id}
                id={section.id}
                aria-labelledby={`${section.id}-title`}
                className={
                  index === 0
                    ? "scroll-mt-24 pb-10"
                    : "scroll-mt-24 border-t border-neutral-200 py-10"
                }
              >
                <h2
                  id={`${section.id}-title`}
                  className="text-[24px] leading-8 font-medium tracking-[-0.01em] text-text-primary"
                >
                  {section.title}
                </h2>
                <div className="mt-6 flex flex-col gap-4 font-work text-[16px] leading-[1.6] text-text-primary">
                  {section.body}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>
      <LandingFooter />
      <LandingMotion sections={false} />
    </>
  );
}
