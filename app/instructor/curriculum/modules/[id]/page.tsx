"use client";

import { FileText, Info, Pencil } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ModuleDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="w-full min-h-screen bg-neutral-50/50 p-6 space-y-6 tracking-wide">
      <div className="flex justify-end">
        <Link href={`/instructor/curriculum/modules/${id}/edit`}>
          <Button className="h-9 px-4 text-sm font-medium rounded-xl bg-brand-primary text-white shadow-xs cursor-pointer inline-flex items-center gap-2">
            <Pencil className="h-3.5 w-3.5" /> Edit module
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
          <section className="space-y-3">
            <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">
              Module {id}
            </h1>
            <p className="text-sm text-neutral-500">
              Module details are not available.
            </p>
          </section>

          <section className="bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-semibold text-neutral-900">
                Module lessons
              </h2>
            </div>
            <p className="text-sm text-neutral-500">
              No lessons are available.
            </p>
          </section>

          <section className="bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-semibold text-neutral-900">
                Assignments
              </h2>
            </div>
            <p className="text-sm text-neutral-500">
              No assignments are available.
            </p>
          </section>

          <section className="bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-xs space-y-4">
            <h2 className="text-base font-semibold text-neutral-900">
              Module content
            </h2>
            <p className="text-sm text-neutral-500">
              No recording or supporting resources are available.
            </p>
          </section>
        </div>

        <aside className="space-y-6">
          <Card className="bg-white border-none ring-0 shadow-xs rounded-2xl p-6">
            <CardContent className="p-0 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-neutral-50 border border-neutral-200 flex items-center justify-center text-neutral-700 shrink-0">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-neutral-900">
                  Module {id}
                </h2>
                <p className="text-xs text-neutral-500">
                  Curriculum details are not available.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="rounded-2xl bg-neutral-100 p-4 flex gap-2.5 text-neutral-700">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="text-sm text-neutral-500 leading-relaxed">
              Module information will appear here when it is available.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
