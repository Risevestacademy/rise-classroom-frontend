"use client";

import * as React from "react";

import {
  ChevronDown,
  FileText,
  Plus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Search, Calendar } from "@/assets/icons";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

const data = {
  completed: 12,
  inProgress: 2,
  notStarted: 2,
};

const upcomingItems = [
  {
    type: "Assignment deadline",
    title: "User Research Report",
    course: "Product Design",
    badge: "Today 11:59PM",
    badgeStyle:
      "bg-semantic-surface-error-badge text-semantic-text-error border-semantic-border-error",
  },
  {
    type: "Content to publish",
    title: "Design Systems",
    course: "Product Design",
    badge: "Tomorrow 10:00AM",
    badgeStyle:
      "bg-semantic-surface-warning-badge text-semantic-text-warning border-semantic-border-warning",
  },
  {
    type: "Assignment review",
    title: "UI Design Portfolio",
    course: "Product Design",
    badge: "Oct 2",
    badgeStyle: "bg-neutral-200 text-neutral-600 border-neutral-300",
  },
];

export default function TrackDetails() {
  const total = data.completed + data.inProgress + data.notStarted;
  const percentage = Math.round((data.completed / total) * 100);

  const chartData = [
    { name: "Completed", value: data.completed, color: "#0D6D78" },
    { name: "Remaining", value: data.inProgress + data.notStarted, color: "#E6F2F3" },
  ];

  return (
    <div className="flex flex-col bg-neutral-100 p-6 space-y-6">
      <div id="heading" className="flex flex-row w-full items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
            Product Design
          </h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            50 students . 4 modules. Jan 5 - Dec 19, 2026
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-700 shadow-xs hover:bg-neutral-200">
          <Calendar className="h-3.5 w-3.5 text-neutral-500" />
          <span>This week</span>
          <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
        </button>
      </div>

      <div>
        <Tabs defaultValue="overview">
          <TabsList variant="line" className="h-auto gap-8 bg-transparent p-0 justify-start rounded-none">
            <TabsTrigger
              value="overview"
              className="relative bg-transparent p-0 pb-3 text-base font-medium text-neutral-500 shadow-none transition-none hover:text-neutral-900 data-[state=active]:bg-transparent data-[state=active]:text-neutral-900 data-[state=active]:shadow-none after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary-500 after:opacity-0 data-[state=active]:after:opacity-100"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="content"
              className="relative bg-transparent p-0 pb-3 text-base font-medium text-neutral-500 shadow-none transition-none hover:text-neutral-900 data-[state=active]:bg-transparent data-[state=active]:text-neutral-900 data-[state=active]:shadow-none after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-primary-500 after:opacity-0 data-[state=active]:after:opacity-100"
            >
              Content
            </TabsTrigger>
            <TabsTrigger
              value="assignments"
              className="relative bg-transparent p-0 pb-3 text-base font-medium text-neutral-500 shadow-none transition-none hover:text-neutral-900 data-[state=active]:bg-transparent data-[state=active]:text-neutral-900 data-[state=active]:shadow-none after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-primary-500 after:opacity-0 data-[state=active]:after:opacity-100"
            >
              Assignments
            </TabsTrigger>
            <TabsTrigger
              value="students"
              className="relative bg-transparent p-0 pb-3 text-base font-medium text-neutral-500 shadow-none transition-none hover:text-neutral-900 data-[state=active]:bg-transparent data-[state=active]:text-neutral-900 data-[state=active]:shadow-none after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-primary-500 after:opacity-0 data-[state=active]:after:opacity-100"
            >
              Students
            </TabsTrigger>
            <TabsTrigger
              value="progress"
              className="relative bg-transparent p-0 pb-3 text-base font-medium text-neutral-500 shadow-none transition-none hover:text-neutral-900 data-[state=active]:bg-transparent data-[state=active]:text-neutral-900 data-[state=active]:shadow-none after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-primary-500 after:opacity-0 data-[state=active]:after:opacity-100"
            >
              Progress
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-8">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="w-full rounded-2xl border border-neutral-100 bg-white p-6 shadow-xs">
                <h3 className="mb-4 text-base font-semibold text-neutral-900">
                  Track progress
                </h3>
                <div className="flex items-center justify-start gap-8">
                  <div className="relative aspect-square w-full max-w-[200px] shrink-0 min-w-0">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={48}
                          outerRadius={62}
                          startAngle={0}
                          endAngle={-360}
                          dataKey="value"
                          stroke="none"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-[#0D6D78]">
                        {percentage}%
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2.5 text-xs text-[#0D6D78]">
                    <div className="flex items-center gap-1.5 font-medium">
                      <span>Completed :</span>
                      <span className="font-semibold">{data.completed}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-medium">
                      <span>In progress :</span>
                      <span className="font-semibold">{data.inProgress}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-medium">
                      <span>Not started :</span>
                      <span className="font-semibold">{data.notStarted}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="w-full rounded-2xl border border-neutral-100 bg-white p-6 shadow-xs">
                <h3 className="mb-4 text-base font-semibold text-neutral-900">
                  Track progress
                </h3>
                {upcomingItems && upcomingItems.length > 0 ? (
                  <div className="divide-y divide-neutral-200">
                    {upcomingItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0"
                      >
                        <div className="space-y-0.5">
                          <p className="text-xs font-semibold text-neutral-900">
                            {item.type} <span className="font-normal text-neutral-400">•</span> {item.title}
                          </p>
                          <p className="text-xs text-neutral-500">{item.course}</p>
                        </div>
                        <span
                          className={cn(
                            "rounded-full border px-2.5 py-0.5 text-[10px] font-medium shrink-0",
                            item.badgeStyle
                          )}
                        >
                          {item.badge}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50/60 mb-3">
                      <FileClock className="h-7 w-7 text-[#0D6D78]" />
                    </div>
                    <h3 className="text-sm font-semibold text-neutral-900">
                      Nothing coming up
                    </h3>
                    <p className="text-xs text-neutral-500 max-w-xs mt-1">
                      Deadlines, content to publish and live sessions appear here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          <TabsContent value="content" className="mt-4">

          </TabsContent>

          <TabsContent value="assignments" className="mt-4">

          </TabsContent>
          <TabsContent value="students" className="mt-4">

          </TabsContent>

          <TabsContent value="progress" className="mt-4">

          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}