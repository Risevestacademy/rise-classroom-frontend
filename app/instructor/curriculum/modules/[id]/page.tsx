"use client";

import {
  Calendar,
  FileText,
  Info,
  MoreHorizontal,
  Pencil,
  Plus,
  Video
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ModuleDetailPage() {
  const [hasRecordingVideos, setHasRecordingVideos] = useState(true);

  return (
    <div className="w-full min-h-screen bg-neutral-50/50 p-6 space-y-6 tracking-wide">
      <div className="flex flex-row justify-end gap-3">
        <Button
          variant="outline"
          className="h-9 px-4 text-sm font-medium rounded-xl border-neutral-200 bg-white shadow-xs cursor-pointer"
        >
          Change Status
        </Button>

        <Link href="/instructor/curriculum/module/1/edit">
          <Button className="h-9 px-4 text-sm font-medium rounded-xl bg-brand-primary text-white hover:bg-neutral-800 shadow-xs cursor-pointer inline-flex items-center gap-2">
            <Pencil className="h-3.5 w-3.5" /> Edit module
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
          {hasRecordingVideos && (
            <div className="space-y-4">
              <div className="relative w-full h-64 sm:h-72 rounded-2xl overflow-hidden shadow-sm">
                <Image
                  src="/module-header.png"
                  alt="Module Banner"
                  fill
                  className="object-cover opacity-90"
                  priority
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="relative rounded-xl overflow-hidden border border-neutral-200 bg-neutral-900 aspect-video shadow-xs group cursor-pointer">
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors">
                    <Video className="h-8 w-8 text-white/90 drop-shadow-md" />
                  </div>
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-[10px] font-medium text-white">
                    Live Class 1
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div className="space-y-3">
              <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">
                Introduction to Design
              </h1>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Discover how product design turns user needs into useful, intuitive and meaningful experiences. Explore the core principles of colour, typography and layout, and learn how designers move from understanding a problem to developing a solution. Through real-world examples, see how thoughtful design improves everyday products and helps people achieve their goals.
              </p>
            </div>

            <div className="space-y-3 pt-2 border-t border-neutral-100">
              <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider">
                What students will learn
              </h3>
              <p className="text-sm text-neutral-500">
                By the end of this lesson, students will be able to:
              </p>
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-3 text-sm text-neutral-700">
                  <span className="font-semibold text-neutral-400">01</span>
                  <span>Understand the basics of visual hierarchy, contrast, and composition</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-neutral-700">
                  <span className="font-semibold text-neutral-400">02</span>
                  <span>Apply color, typography, and spacing to communicate a message</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-neutral-700">
                  <span className="font-semibold text-neutral-400">03</span>
                  <span>Create a simple composition that guides the viewer's attention</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-neutral-900">Module lessons</h3>
                <p className="text-sm text-neutral-500 mt-0.5">Three lessons are currently attached to this module.</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="p-4 rounded-xl border border-neutral-200/80 bg-neutral-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Lesson 1 · Foundations</span>
                    <h4 className="text-sm font-semibold text-neutral-900 mt-0.5">Introduction to visual design</h4>
                  </div>
                  <button className="h-7 w-7 rounded-lg inline-flex items-center justify-center text-neutral-500 hover:bg-neutral-200 transition-colors">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-sm text-neutral-600">
                  Cover the basics of design thinking, visual principles, and how to communicate ideas clearly.
                </p>
                <div className="flex items-center gap-3 p-2.5 rounded-lg border border-neutral-200/80 bg-white w-fit">
                  <div className="h-7 w-7 rounded bg-red-100 flex items-center justify-center text-red-600">
                    <FileText className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">Visual principles.pdf</p>
                    <p className="text-[10px] text-neutral-500">1.2 MB</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-neutral-200/80 bg-neutral-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Lesson 2 · Color & typography</span>
                    <h4 className="text-sm font-semibold text-neutral-900 mt-0.5">Color & typography basics</h4>
                  </div>
                  <button className="h-7 w-7 rounded-lg inline-flex items-center justify-center text-neutral-500 hover:bg-neutral-200 transition-colors">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-sm text-neutral-600">
                  Learn how to choose colors, pair typefaces, and create readable layouts.
                </p>
                <div className="flex items-center gap-3 p-2.5 rounded-lg border border-neutral-200/80 bg-white w-fit">
                  <div className="h-7 w-7 rounded bg-red-100 flex items-center justify-center text-red-600">
                    <FileText className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">Color and type.pdf</p>
                    <p className="text-[10px] text-neutral-500">1.2 MB</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-neutral-200/80 bg-neutral-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Lesson 3 · Composition & layout</span>
                    <h4 className="text-sm font-semibold text-neutral-900 mt-0.5">Composition & layout</h4>
                  </div>
                  <button className="h-7 w-7 rounded-lg inline-flex items-center justify-center text-neutral-500 hover:bg-neutral-200 transition-colors">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-sm text-neutral-600">
                  Practice arranging elements to guide attention, balance content, and create flow.
                </p>
                <div className="flex items-center gap-3 p-2.5 rounded-lg border border-neutral-200/80 bg-white w-fit">
                  <div className="h-7 w-7 rounded bg-red-100 flex items-center justify-center text-red-600">
                    <FileText className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">Layout exercises.pdf</p>
                    <p className="text-[10px] text-neutral-500">1.2 MB</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-semibold text-neutral-900">Assignments</h3>
              <p className="text-sm text-neutral-500 mt-0.5">Add practical exercises that help students apply what they've learned.</p>
            </div>

            <div className="p-4 rounded-xl border border-neutral-200/80 bg-neutral-50/40 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Assignment 1 · Visual hierarchy</span>
                  <h4 className="text-sm font-semibold text-neutral-900 mt-0.5">Redesign a simple landing page using hierarchy and contrast</h4>
                </div>
                <button className="h-7 w-7 rounded-lg inline-flex items-center justify-center text-neutral-500 hover:bg-neutral-200 transition-colors">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-neutral-600">
                Use typography, spacing, and color to guide the viewer through the page.
              </p>
              <div className="flex items-center gap-3 p-2.5 rounded-lg border border-neutral-200/80 bg-white w-fit">
                <div className="h-7 w-7 rounded bg-red-100 flex items-center justify-center text-red-600">
                  <FileText className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">Assignment Doc.pdf</p>
                  <p className="text-[10px] text-neutral-500">1.2 MB</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-neutral-900">Module content</h3>
              <Button variant="outline" className="h-8 px-3 text-sm font-medium rounded-lg border-neutral-300">
                Manage resources
              </Button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-neutral-500">Class recording link</label>
                <div className="mt-1 flex items-center gap-2 p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-sm text-neutral-700">
                  <Video className="h-4 w-4 text-neutral-400 shrink-0" />
                  <span className="truncate">https://risecampus.com/academy/design-systems</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-neutral-500">Supporting resources</label>
                <div className="mt-1 flex items-center gap-3 p-2.5 rounded-lg border border-neutral-200/80 bg-white w-fit">
                  <div className="h-7 w-7 rounded bg-red-100 flex items-center justify-center text-red-600">
                    <FileText className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">Design.pdf</p>
                    <p className="text-[10px] text-neutral-500">2.4 MB</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        <div className="space-y-6">
          <Card className="bg-white border-none ring-0 shadow-xs rounded-2xl overflow-hidden p-0">
            <div className="relative w-full h-20 bg-blue-100">
              <Image
                src="/curriculum-header.png"
                alt="Track Header"
                fill
                className="object-cover"
                priority
              />
            </div>
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">Part of curriculum</span>
                <Badge variant="secondary" className="bg-emerald-100/80 text-emerald-700 rounded-full px-2.5 py-0.5 text-sm font-medium border-0">
                  Active
                </Badge>
              </div>

              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-neutral-900">Design Track Curriculum</h2>
                <p className="text-sm text-neutral-500 font-medium">Design · Cohort 2026</p>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/60">
                <div className="h-8 w-8 rounded-lg bg-white shadow-xs border border-neutral-200 flex items-center justify-center text-neutral-700 shrink-0">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-neutral-900">Module 1</h4>
                  <p className="text-[11px] text-neutral-500">Added after the 12 existing modules.</p>
                </div>
              </div>

              <hr className="border-neutral-100" />

              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 border border-neutral-200">
                  <AvatarImage src="/images/aishat-avatar.png" alt="Aishat Lawal" />
                  <AvatarFallback className="bg-indigo-100 text-indigo-700 text-sm font-semibold">AL</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider">Instructor</p>
                  <h4 className="text-sm font-semibold text-neutral-900">Aishat Lawal</h4>
                  <p className="text-[11px] text-neutral-500">aishatalawal21@gmail.com</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-none ring-0 shadow-xs rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-neutral-900">Curriculum live classes</h3>
              <span className="text-sm font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">3 classes</span>
            </div>
            <p className="text-sm text-neutral-500">
              These live sessions are attached to the curriculum and are visible to all students enrolled in the track.
            </p>

            <div className="space-y-3 pt-1">
              <div className="p-3 rounded-xl border border-neutral-200/80 bg-neutral-50/50 space-y-1">
                <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
                  <Video className="h-3.5 w-3.5 text-neutral-500" />
                  <span>Foundations · Week 1</span>
                </div>
                <p className="text-[11px] text-neutral-500 pl-5">Curriculum live class</p>
                <div className="flex items-center gap-1.5 text-[11px] text-neutral-600 pl-5 pt-1">
                  <Calendar className="h-3 w-3 text-neutral-400" />
                  <span>Saturday, October 10 2026</span>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-neutral-200/80 bg-neutral-50/50 space-y-1">
                <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
                  <Video className="h-3.5 w-3.5 text-neutral-500" />
                  <span>Color · Week 1</span>
                </div>
                <p className="text-[11px] text-neutral-500 pl-5">Curriculum live class</p>
                <p className="text-[11px] text-neutral-500 pl-5 pt-1">
                  Date and instructor details will be confirmed before the session is published.
                </p>
              </div>

              <div className="p-3 rounded-xl border border-neutral-200/80 bg-neutral-50/50 space-y-1">
                <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
                  <Video className="h-3.5 w-3.5 text-neutral-500" />
                  <span>layout · Week 1</span>
                </div>
                <p className="text-[11px] text-neutral-500 pl-5">Curriculum live class</p>
                <p className="text-[11px] text-neutral-500 pl-5 pt-1">
                  Date and instructor details will be confirmed before the session is published.
                </p>
              </div>
            </div>

            <Button variant="outline" className="w-full h-9 border-neutral-300 text-sm font-medium rounded-xl">
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Add live class
            </Button>
          </Card>

          <div className="rounded-2xl bg-neutral-100 p-4 space-y-3 text-neutral-700">
            <div className="flex gap-2.5">
              <Info className="h-4 w-4 text-gray shrink-0 mt-0.5" />
              <div className="space-y-1 text-sm">
                <p className="font-semibold text-neutral-900">Not visible to students yet</p>
                <p className="text-neutral-500 leading-relaxed">
                  Draft modules aren't visible to students until you publish them. Review your lessons and resources before publishing.
                </p>
              </div>
            </div>
            <Button className="w-full h-9 bg-white text-blacktext-sm font-medium rounded-xl shadow-xs">
              Preview as student
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}