"use client";

import { ChevronDown, Info } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Error } from "@/components/ui/hint";
import { Input } from "@/components/ui/input";
import { Field } from "@base-ui/react/field";


export default function CreateAssignmentPage({ }) {
  const router = useRouter();

  return (
    <div className="w-full flex flex-col p-6 space-y-6 tracking-wide">
      <div className="mb-2">
        <p onClick={() => (router.back())} className="cursor-pointer text-sm mb-2">
          &lt; Back to Module
        </p>
        <h1 className="text-[24px] font-semibold mb-[4px]">
          Add Resource
        </h1>
        <p className="text-[14px] font-regular text-neutral-500">
          Upload a new resource for this Curriculum
        </p>
      </div>

      <div className="flex flex-row gap-6 w-full items-start">
        <form className="w-[70%]">
          <Card className="bg-white border-none ring-0 shadow-xs rounded-2xl  p-4">
            <CardHeader className="p-0 mb-2">
              <CardTitle className="text-[18px] font-semibold">
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-4">
                <Field.Root className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-neutral-800">
                    Resource type
                  </label>
                  <div className="relative">
                    <select
                      className="w-full appearance-none rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-800 focus:outline-none focus:ring-1 focus:ring-teal-700"
                    >
                      <option value="pdf">PDF</option>
                      <option value="docx">DOCX</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-neutral-400 pointer-events-none" />
                  </div>
                </Field.Root>

                <Field.Root className="flex flex-col space-y-1.5">
                  <Field.Label className="text-[14px] font-medium text-text-primary">
                    Title <span className="text-red-500">*</span>
                  </Field.Label>
                  <Input
                    name="title"
                    placeholder="Type module title..."
                    leadingIcon={null}
                  />
                  <Error className="text-sm text-error-text"></Error>
                </Field.Root>

                <Field.Root className="flex flex-col space-y-1.5">
                  <Field.Label className="text-[14px] font-medium text-text-primary">
                    Description <span className="text-neutral-400 font-normal">(Optional)</span>
                  </Field.Label>
                  <textarea
                    name="description"
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-neutral-800"
                  />
                  <Error className="text-sm text-error-text"></Error>
                </Field.Root>

                <Field.Root className="flex flex-col space-y-1.5">
                  <Field.Label className="text-[14px] font-medium text-text-primary">
                    Resources <span className="text-neutral-400 font-normal">(Optional)</span>
                  </Field.Label>
                  <Input
                    name="resources"
                    placeholder="Type module title..."
                    leadingIcon={null}
                  />
                  <Error className="text-sm text-error-text"></Error>
                </Field.Root>

                <Field.Root className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-neutral-800">
                    Attach to <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      className="w-full appearance-none rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-800 focus:outline-none focus:ring-1 focus:ring-teal-700"
                    >
                      <option value="module-1">Module 1 - Introduction to Design</option>
                      <option value="module-2">Module 2 - Design Thinking</option>
                      <option value="module-3">Module 3 - User Research</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-neutral-400 pointer-events-none" />
                  </div>
                </Field.Root>

                <Field.Root className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-neutral-800">
                    Lesson
                  </label>
                  <div className="relative">
                    <select
                      className="w-full appearance-none rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-800 focus:outline-none focus:ring-1 focus:ring-teal-700"
                    >
                      <option value="lesson-1">Lesson 1</option>
                      <option value="lesson-2">Lesson 2</option>
                      <option value="lesson-3">Lesson 3</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-neutral-400 pointer-events-none" />
                  </div>
                </Field.Root>
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-end gap-3 w-full sm:w-auto mt-4">
            <Button type="button" variant="secondary" className="flex-1 sm:flex-none border-neutral-300 rounded-lg px-5 py-4 text-sm font-medium">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 sm:flex-none bg-brand-primary text-white rounded-lg px-6 py-4 text-sm font-medium">
              Create Resource
            </Button>
          </div>
        </form>

        <div className="w-[30%] hidden md:block space-y-4">
          <div className="rounded-2xl bg-indigo-50/50 border border-indigo-100 p-4 flex gap-3 text-neutral-700">
            <Info className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-sm">
              <p className="font-semibold text-neutral-900">
                Create now, build next
              </p>
              <p className="text-neutral-500 leading-relaxed">
                After creating your module, add lessons, quizzes and assignments from its detail page. Draft modules aren&apos;t visible to students until you publish them.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div >
  )
}