"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  ChevronDown
} from "lucide-react";

import { Search, Calendar } from "@/assets/icons";

export default function MyTracks() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex flex-col bg-neutral-100 p-6 space-y-6">
      <div id="heading" className="flex flex-row w-full items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
            View Tracks
          </h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            VIew and manage the tracks you're assigned to
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-700 shadow-xs hover:bg-neutral-200">
          <Calendar className="h-3.5 w-3.5 text-neutral-500" />
          <span>This week</span>
          <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
        </button>
      </div>

      <div className=" flex flex-row h-10 items-center gap-2 rounded-lg border border-neutral-300 px-3 text-neutral-400 md:flex md:w-48 lg:w-64">
        <Search />
        <input
          type="search"
          placeholder="Search tracks"
          className="w-full bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
        />
      </div>

      <div onClick={() => router.push(`${pathname}/details`)} className="bg-white rounded-xl border border-neutral-300 p-5 space-y-4 cursor-pointer">
        <div>
          <h3 className="text-sm font-bold text-neutral-900">Product Design</h3>
          <p className="text-xs text-neutral-500 mt-1">50 students • 4 modules</p>
        </div>
        <div className="space-y-1.5">
          <div className="h-2 w-full rounded-full bg-neutral-200 overflow-hidden">
            <div className="h-full w-[68%] rounded-full bg-primary-500" />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-neutral-800">68% complete</span>
          </div>
        </div>
        <p className="text-xs text-neutral-600">
          <span className="font-medium text-neutral-900">Next:</span> User Research (Module 3)
        </p>
      </div>
    </div>
  );
}