"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  ChevronDown,
  Calendar
} from "lucide-react";
import { Search } from "@/assets/icons";

export default function MyTracks() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex flex-col bg-neutral-50 p-6 space-y-6">
      <div id="heading" className="flex flex-row w-full items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800 tracking-tight">
            View Tracks
          </h1>
          <p className="text-sm text-neutral-400 mt-0.5">
            VIew and manage the tracks you&apos;re assigned to
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-0 px-3 py-1.5 text-xs font-medium text-neutral-600 shadow-xs hover:bg-neutral-100">
          <Calendar className="h-3.5 w-3.5 text-neutral-400" />
          <span>This week</span>
          <ChevronDown className="h-3.5 w-3.5 text-neutral-300" />
        </button>
      </div>

      <div className=" flex flex-row h-10 items-center gap-2 rounded-lg border border-neutral-200 px-3 text-neutral-300 md:flex md:w-48 lg:w-64">
        <Search />
        <input
          type="search"
          placeholder="Search tracks"
          className="w-full bg-transparent text-sm text-neutral-800 placeholder:text-neutral-300 focus:outline-none"
        />
      </div>

      <div onClick={() => router.push(`${pathname}/details`)} className="bg-white rounded-xl border border-neutral-200 p-5 space-y-4 cursor-pointer">
        <div>
          <h3 className="text-sm font-bold text-neutral-800">Product Design</h3>
          <p className="text-xs text-neutral-400 mt-1">50 students • 4 modules</p>
        </div>
        <div className="space-y-1.5">
          <div className="h-2 w-full rounded-full bg-neutral-100 overflow-hidden">
            <div className="h-full w-[68%] rounded-full bg-brand-primary" />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-neutral-700">68% complete</span>
          </div>
        </div>
        <p className="text-xs text-neutral-500">
          <span className="font-medium text-neutral-800">Next:</span> User Research (Module 3)
        </p>
      </div>
    </div>
  );
}