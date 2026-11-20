"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";

import { Logo } from "@/assets/logo";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getMoreInfoApplication,
  hasFirstAndLastName,
  moreInfoErrorMessage,
  submitMoreInfoAnswer,
} from "@/lib/sign-up";
import { MoreInfoForm, type MoreInfoValues } from "./MoreInfoForm";

const buttonClass = "mt-8 w-full cursor-pointer rounded-full text-base";

export function MoreInfo(): React.JSX.Element {
  const token = useSearchParams().get("token") ?? "";

  const application = useQuery({
    queryKey: ["more-info", token],
    queryFn: () => getMoreInfoApplication(token),
    enabled: Boolean(token),
    /* The link is rate-limited, and a refusal won't change on a second try. */
    retry: false,
    staleTime: Infinity,
  });

  const answer = useMutation({
    mutationFn: (values: MoreInfoValues) =>
      submitMoreInfoAnswer({ token, ...values }),
  });

  if (answer.isSuccess) {
    return (
      <Notice
        title="Thanks, we've got your answer"
        message="Your application is back in review. We'll be in touch by email."
      />
    );
  }
  if (!token) {
    return (
      <Notice
        title="This link isn't complete"
        message="Please open the link from our email again."
      />
    );
  }
  if (application.isError) {
    return (
      <Notice
        title="We can't open this link"
        message={moreInfoErrorMessage(application.error)}
      />
    );
  }

  return (
    <div>
      <div className="flex justify-center">
        <Logo variant="teal" size="lg" />
      </div>
      <h1 className="mt-10 text-2xl/8 font-semibold text-text-primary">
        We need a little more information
      </h1>
      <p className="mt-2 font-work text-sm text-text-secondary">
        Answer the question below and we&apos;ll carry on reviewing your
        application.
      </p>

      {application.isPending ? (
        <div className="mt-8 flex flex-col gap-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : (
        <MoreInfoForm
          application={application.data}
          isSubmitting={answer.isPending}
          error={answer.isError ? moreInfoErrorMessage(answer.error) : null}
          validate={(values) =>
            hasFirstAndLastName(values.fullName)
              ? null
              : "Please enter your first and last name"
          }
          onSubmit={(values) => answer.mutate(values)}
        />
      )}
    </div>
  );
}

function Notice({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <Logo variant="teal" size="lg" />
      <h1 className="mt-10 text-2xl/8 font-semibold text-text-primary">
        {title}
      </h1>
      <p className="mt-1 max-w-[336px] font-work text-sm text-text-secondary">
        {message}
      </p>
      <Button
        variant="primary"
        size="lg"
        className={buttonClass}
        nativeButton={false}
        render={<Link href="/" />}
      >
        Back to homepage
      </Button>
    </div>
  );
}
