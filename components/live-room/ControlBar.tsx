"use client";

import * as React from "react";

import {
  ComputerScreenShare,
  Mic02,
  MicOff02,
  Settings01,
  Smile,
  Video,
  VideoOff,
  WavingHand02,
} from "@/assets/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { feedbackOptions, reactionEmojis, type Feedback } from "@/lib/live-room";
import { cn } from "@/lib/utils";
import { RoomMenuContent, RoomMenuItem } from "./RoomMenu";
import { ariaShortcut, useOnMac, withShortcut, type ShortcutAction } from "./shortcuts";

const control =
  "flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl transition-[background-color,color,scale] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-50 max-sm:size-10 motion-safe:active:not-disabled:scale-92 [&_svg]:size-5";
const idle = "bg-room-control text-white hover:bg-room-control-hover";
const active = "bg-room-active text-text-brand";
const off = "bg-room-off text-room-off-text hover:bg-[#ecc0c0]";
// The icon pops in when a control flips.
const swap = "motion-safe:animate-in motion-safe:zoom-in-50 motion-safe:fade-in-0 motion-safe:duration-200";

export type ControlBarProps = {
  micOn: boolean;
  cameraOn: boolean;
  sharing: boolean;
  handRaised: boolean;
  feedback?: Feedback;
  isHost: boolean;
  canShareScreen: boolean;
  /** What the host has turned off for everyone else; hosts get `{}`. */
  blocked: { microphone?: boolean; camera?: boolean; reactions?: boolean; handRaising?: boolean };
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleShare: () => void;
  onToggleHand: () => void;
  onReact: (emoji: string) => void;
  onFeedback: (feedback: Feedback | null) => void;
  onOpenSettings: () => void;
  onLeave: () => void;
  onEndForAll: () => void;
};

/** The call controls along the bottom of the room. */
export function ControlBar(props: ControlBarProps) {
  const { micOn, cameraOn, sharing, handRaised, feedback, isHost, blocked } = props;

  return (
    <div className="flex justify-center px-3 pt-3 pb-4 sm:pb-5">
      <div
        role="toolbar"
        aria-label="Call controls"
        className="flex items-center gap-2 rounded-2xl border border-white/5 bg-room-panel p-2 shadow-[0_8px_24px_rgb(0_0_0/0.35)] sm:gap-2.5"
      >
        <ToggleButton
          on={micOn}
          label={micOn ? "Turn off microphone" : "Turn on microphone"}
          blockedLabel={!micOn && blocked.microphone ? "The host has turned off microphones" : undefined}
          shortcut="mic"
          onClick={props.onToggleMic}
          className={micOn ? idle : off}
        >
          {micOn ? <Mic02 key="on" className={swap} /> : <MicOff02 key="off" className={swap} />}
        </ToggleButton>
        <ToggleButton
          on={cameraOn}
          label={cameraOn ? "Turn off camera" : "Turn on camera"}
          blockedLabel={!cameraOn && blocked.camera ? "The host has turned off cameras" : undefined}
          shortcut="camera"
          onClick={props.onToggleCamera}
          className={cameraOn ? idle : off}
        >
          {cameraOn ? <Video key="on" className={swap} /> : <VideoOff key="off" className={swap} />}
        </ToggleButton>

        {props.canShareScreen && (
          <ToggleButton
            on={sharing}
            label={sharing ? "Stop presenting" : "Present your screen"}
            shortcut="share"
            onClick={props.onToggleShare}
            className={cn("max-sm:hidden", sharing ? active : idle)}
          >
            <ComputerScreenShare />
          </ToggleButton>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={blocked.reactions ? "The host has turned off reactions" : "Reactions and feedback"}
            title={blocked.reactions ? "The host has turned off reactions" : "Reactions and feedback"}
            disabled={blocked.reactions}
            className={cn(control, feedback ? active : idle, "data-popup-open:bg-room-active data-popup-open:text-text-brand")}
          >
            <Smile />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="center"
            sideOffset={12}
            className="w-[220px] min-w-0 rounded-2xl bg-room-popover p-0 text-white shadow-[0_8px_24px_rgb(0_0_0/0.5)] ring-0"
          >
            <DropdownMenuGroup aria-label="Reactions" className="grid grid-cols-6 gap-x-2 gap-y-1.5 px-3 py-3">
              {reactionEmojis.map((emoji) => (
                <DropdownMenuItem
                  key={emoji}
                  aria-label={`React ${emoji}`}
                  closeOnClick={false}
                  onClick={() => props.onReact(emoji)}
                  className="size-7 justify-center rounded-md p-0 text-lg transition-transform focus:scale-125 focus:bg-white/10"
                >
                  {emoji}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <div className="h-px bg-white/20" />
            <DropdownMenuGroup aria-label="Feedback" className="py-1">
              {feedbackOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  aria-checked={feedback === option.value}
                  role="menuitemcheckbox"
                  onClick={() => props.onFeedback(feedback === option.value ? null : option.value)}
                  className={cn(
                    "gap-3 rounded-none px-4 py-1.5 text-xs text-white focus:bg-white/10 focus:text-white",
                    feedback === option.value && "bg-white/10",
                  )}
                >
                  <span aria-hidden className="w-5 text-center text-base">
                    {option.emoji}
                  </span>
                  {option.label}
                  {feedback === option.value && <span className="ml-auto text-[10px] text-room-text-muted">Clear</span>}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <ToggleButton
          on={handRaised}
          label={handRaised ? "Lower hand" : "Raise hand"}
          blockedLabel={!handRaised && blocked.handRaising ? "The host has turned off hand raising" : undefined}
          shortcut="hand"
          onClick={props.onToggleHand}
          className={handRaised ? active : idle}
        >
          <WavingHand02 className={cn(handRaised && "motion-safe:animate-[room-wave_0.6s_ease-in-out]")} />
        </ToggleButton>

        <button
          type="button"
          aria-label="Session settings"
          title="Session settings"
          aria-haspopup="dialog"
          onClick={props.onOpenSettings}
          className={cn(control, idle)}
        >
          <Settings01 />
        </button>

        {isHost ? (
          <DropdownMenu>
            <DropdownMenuTrigger className={leaveButton}>Leave</DropdownMenuTrigger>
            <RoomMenuContent side="top" align="end" sideOffset={12} className="w-[240px]">
              <RoomMenuItem onClick={props.onLeave}>Leave session</RoomMenuItem>
              <RoomMenuItem variant="destructive" onClick={props.onEndForAll}>
                End session for everyone
              </RoomMenuItem>
            </RoomMenuContent>
          </DropdownMenu>
        ) : (
          <button type="button" onClick={props.onLeave} className={leaveButton}>
            Leave
          </button>
        )}
      </div>
    </div>
  );
}

const leaveButton =
  "flex h-11 shrink-0 cursor-pointer items-center rounded-full bg-room-leave px-5 text-base font-medium text-white transition-colors hover:bg-room-leave-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white max-sm:h-10 max-sm:px-4";

function ToggleButton({
  on,
  label,
  blockedLabel,
  shortcut,
  onClick,
  className,
  children,
}: {
  on: boolean;
  label: string;
  shortcut?: ShortcutAction;
  /** Set when the host doesn't allow turning this on. */
  blockedLabel?: string;
  onClick: () => void;
  className: string;
  children: React.ReactNode;
}) {
  const mac = useOnMac();
  const title = blockedLabel ?? (shortcut ? withShortcut(label, shortcut, mac) : label);
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={blockedLabel ?? label}
      aria-keyshortcuts={shortcut && !blockedLabel ? ariaShortcut(shortcut, mac) : undefined}
      title={title}
      disabled={Boolean(blockedLabel)}
      onClick={onClick}
      className={cn(control, className)}
    >
      {children}
    </button>
  );
}
