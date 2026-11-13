"use client";

import * as React from "react";

import { QuestionBuilder } from "@/components/settings/QuestionBuilder";

export default function EditQuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ question?: string }>;
}) {
  /* Without `?question=`, every question opens for editing. */
  const { question } = React.use(searchParams);

  return <QuestionBuilder key={question} mode="edit" questionId={question} />;
}
