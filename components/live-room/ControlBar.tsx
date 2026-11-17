"use client";

import * as React from "react";
import { useMediaDeviceSelect } from "@livekit/components-react";

import {
  ArrowUp01,
  CallEnd,
  ComputerScreenShare,
  Link01,
  Message01,
  Mic02,
  MicOff02,
  MoreVertical,
  Smile,
  UserMultiple,
  Video,
  VideoOff,
  WavingHand02,
} from "@/assets/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { reactionEmojis } from "@/lib/live-room";
import { cn } from "@/lib/utils";
import { RoomMenuContent, RoomMenuItem, RoomMenuLabel, RoomMenuRadioItem, RoomMenuSeparator } from "./RoomMenu";
import type { PanelTab } from "./SidePanel";

const control =
  "flex h-[41px] cursor-pointer items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:size-5";
const idle = "bg-room-control text-white hover:bg-room-control-hover";

export type ControlBarProps = {
  micOn: boolean;
  cameraOn: boolean;
  sharing: boolean;
  handRaised: boolean;
  isHost: boolean;
  panel: PanelTab | null;
  unreadChat: boolean;
  raisedHands: number;
  canShareScreen: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleShare: () => void;
  onToggleHand: () => void;
  onReact: (emoji: string) => void;
  onPanel: (tab: PanelTab) => void;
  onCopyLink: () => void;
  onLeave: () => void;
  onEndForAll: () => void;
};

/** The call controls along the bottom of the room, and the chat/people toggles beside them. */
export function ControlBar(props: ControlBarProps) {
  const { micOn, cameraOn, sharing, handRaised, isHost, panel } = props;

  return (
    <div className="flex items-end justify-center gap-3 px-3 pb-4 sm:pb-6 lg:justify-between lg:px-8">
      <span className="hidden w-[108px] lg:block" />

      <div role="toolbar" aria-label="Call controls" className="flex items-center gap-2 rounded-3xl bg-room-bar p-2.5 sm:gap-3 sm:px-4 sm:py-3">
        <DeviceToggle
          kind="audioinput"
          on={micOn}
          label={micOn ? "Turn off microphone" : "Turn on microphone"}
          icon={micOn ? <Mic02 /> : <MicOff02 />}
          onToggle={props.onToggleMic}
        />
        <DeviceToggle
          kind="videoinput"
          on={cameraOn}
          label={cameraOn ? "Turn off camera" : "Turn on camera"}
          icon={cameraOn ? <Video /> : <VideoOff />}
          onToggle={props.onToggleCamera}
        />

        {props.canShareScreen && (
          <button
            type="button"
            aria-pressed={sharing}
            aria-label={sharing ? "Stop presenting" : "Present your screen"}
            title={sharing ? "Stop presenting" : "Present your screen"}
            onClick={props.onToggleShare}
            className={cn(control, "w-12 max-sm:hidden", sharing ? "bg-room-active text-text-brand" : idle)}
          >
            <ComputerScreenShare />
          </button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger aria-label="Send a reaction" title="Send a reaction" className={cn(control, idle, "w-12 data-popup-open:bg-room-active data-popup-open:text-text-brand")}>
            <Smile />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="center"
            sideOffset={12}
            className="flex w-auto min-w-0 gap-0.5 rounded-full bg-[#292b2b] p-1.5 ring-0"
          >
            {reactionEmojis.map((emoji) => (
              <DropdownMenuItem
                key={emoji}
                aria-label={`React ${emoji}`}
                closeOnClick={false}
                onClick={() => props.onReact(emoji)}
                className="size-8 justify-center rounded-full p-0 text-lg transition-transform focus:scale-125 focus:bg-white/10"
              >
                {emoji}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          type="button"
          aria-pressed={handRaised}
          aria-label={handRaised ? "Lower hand" : "Raise hand"}
          title={handRaised ? "Lower hand" : "Raise hand"}
          onClick={props.onToggleHand}
          className={cn(control, "w-12 max-sm:hidden", handRaised ? "bg-brand-700 text-white hover:bg-brand-600" : idle)}
        >
          <WavingHand02 />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger aria-label="More options" title="More options" className={cn(control, idle, "w-[30px]")}>
            <MoreVertical />
          </DropdownMenuTrigger>
          <RoomMenuContent side="top" align="center" sideOffset={12} className="w-[224px]">
            <DropdownMenuGroup className="sm:hidden">
              <RoomMenuItem onClick={props.onToggleHand}>
                <WavingHand02 /> {handRaised ? "Lower hand" : "Raise hand"}
              </RoomMenuItem>
              <RoomMenuItem onClick={() => props.onPanel("chat")}>
                <Message01 /> Chat
              </RoomMenuItem>
              <RoomMenuItem onClick={() => props.onPanel("participants")}>
                <UserMultiple /> Participants
              </RoomMenuItem>
              <RoomMenuSeparator />
            </DropdownMenuGroup>
            <RoomMenuItem onClick={props.onCopyLink}>
              <Link01 /> Copy session link
            </RoomMenuItem>
          </RoomMenuContent>
        </DropdownMenu>

        {isHost ? (
          <DropdownMenu>
            <DropdownMenuTrigger aria-label="Leave or end the session" title="Leave" className={cn(control, "w-[62px] bg-room-leave text-white hover:bg-room-leave-hover [&_svg]:size-6")}>
              <CallEnd />
            </DropdownMenuTrigger>
            <RoomMenuContent side="top" align="end" sideOffset={12} className="w-[240px]">
              <RoomMenuItem onClick={props.onLeave}>Leave session</RoomMenuItem>
              <RoomMenuItem variant="destructive" onClick={props.onEndForAll}>
                End session for everyone
              </RoomMenuItem>
            </RoomMenuContent>
          </DropdownMenu>
        ) : (
          <button
            type="button"
            aria-label="Leave session"
            title="Leave session"
            onClick={props.onLeave}
            className={cn(control, "w-[62px] bg-room-leave text-white hover:bg-room-leave-hover [&_svg]:size-6")}
          >
            <CallEnd />
          </button>
        )}
      </div>

      <div className="hidden items-center gap-1 rounded-3xl bg-room-bar p-1 sm:flex">
        <UtilityButton
          label="Chat"
          active={panel === "chat"}
          dot={props.unreadChat}
          onClick={() => props.onPanel("chat")}
        >
          <Message01 />
        </UtilityButton>
        <UtilityButton
          label="Participants"
          active={panel === "participants"}
          count={props.raisedHands}
          onClick={() => props.onPanel("participants")}
        >
          <UserMultiple />
        </UtilityButton>
      </div>
    </div>
  );
}

function UtilityButton({
  label,
  active,
  dot,
  count,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  dot?: boolean;
  count?: number;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={count ? `${label}, ${count} ${count === 1 ? "hand" : "hands"} raised` : dot ? `${label}, new messages` : label}
      title={label}
      onClick={onClick}
      className={cn(
        "relative flex size-10 cursor-pointer items-center justify-center rounded-full transition-colors [&_svg]:size-5",
        active ? "bg-room-active text-text-brand" : "text-white hover:bg-room-control",
      )}
    >
      {children}
      {dot && !active && <span className="absolute top-2 right-2 size-2 rounded-full bg-room-active ring-2 ring-room-bar" />}
      {!!count && (
        <span className="absolute -top-1 -right-1 flex min-w-5 items-center justify-center rounded-full bg-brand-700 px-1 text-[11px]/5 font-medium text-white">
          {count}
        </span>
      )}
    </button>
  );
}

/** Mic or camera: the toggle, plus a menu on its left to pick the device. */
function DeviceToggle({
  kind,
  on,
  label,
  icon,
  onToggle,
}: {
  kind: "audioinput" | "videoinput";
  on: boolean;
  label: string;
  icon: React.ReactNode;
  onToggle: () => void;
}) {
  const { devices, activeDeviceId, setActiveMediaDevice } = useMediaDeviceSelect({ kind });
  const noun = kind === "audioinput" ? "microphone" : "camera";

  return (
    <div className={cn("flex items-center rounded-[11px] p-0", on ? "bg-room-control" : "bg-room-off-menu")}>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Choose ${noun}`}
          title={`Choose ${noun}`}
          className="flex h-[41px] w-6 cursor-pointer items-center justify-center rounded-l-[11px] text-room-text transition-colors hover:bg-white/10 max-sm:hidden [&_svg]:size-3"
        >
          <ArrowUp01 />
        </DropdownMenuTrigger>
        <RoomMenuContent side="top" align="start" sideOffset={12} className="w-[288px]">
          <DropdownMenuGroup>
            <RoomMenuLabel className="capitalize">{noun}</RoomMenuLabel>
            {devices.length === 0 ? (
              <RoomMenuItem disabled>No {noun} found</RoomMenuItem>
            ) : (
              <DropdownMenuRadioGroup value={activeDeviceId} onValueChange={(id) => setActiveMediaDevice(id as string)}>
                {devices.map((device, index) => (
                  <RoomMenuRadioItem key={device.deviceId} value={device.deviceId}>
                    <span className="truncate">{device.label || `${noun} ${index + 1}`}</span>
                  </RoomMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            )}
          </DropdownMenuGroup>
        </RoomMenuContent>
      </DropdownMenu>
      <button
        type="button"
        aria-pressed={on}
        aria-label={label}
        title={label}
        onClick={onToggle}
        className={cn(
          "flex size-[41px] cursor-pointer items-center justify-center rounded-[11px] transition-colors focus-visible:outline-2 focus-visible:outline-white [&_svg]:size-5",
          on ? "text-white hover:bg-room-control-hover" : "bg-room-off text-room-off-text hover:bg-[#ecc0c0]",
        )}
      >
        {icon}
      </button>
    </div>
  );
}
