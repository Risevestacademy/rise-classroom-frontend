"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { useMediaDeviceSelect } from "@livekit/components-react";

import { Cancel01, RecordCircle, Shield01, UserMultiple, Video } from "@/assets/icons";
import { SettingsSwitch } from "@/components/settings/SettingsControls";
import { settingsSelectClass } from "@/components/settings/SettingsSection";
import { SelectInput } from "@/components/ui/select";
import {
  recordingVisibilityOptions,
  videoQualityOptions,
  type SessionSettings as Settings,
} from "@/lib/live-room";
import { cn } from "@/lib/utils";
import { readSavedChoices, saveChoices } from "./PreJoinScreen";

type SectionId = "permissions" | "access" | "media" | "recording";
type Change = (patch: Partial<Settings>) => void;

const sections: {
  id: SectionId;
  label: string;
  description: string;
  icon: React.ReactNode;
  hostOnly: boolean;
}[] = [
  {
    id: "permissions",
    label: "Participants & permissions",
    description: "Control what participants can do during this session.",
    icon: <UserMultiple />,
    hostOnly: true,
  },
  {
    id: "access",
    label: "Access & security",
    description: "Control who can access and join this session.",
    icon: <Shield01 />,
    hostOnly: true,
  },
  {
    id: "media",
    label: "Audio & video",
    description: "Configure default audio and video settings for this session.",
    icon: <Video />,
    hostOnly: false,
  },
  {
    id: "recording",
    label: "Recording",
    description: "Choose how this session is recorded and who can watch it.",
    icon: <RecordCircle />,
    hostOnly: true,
  },
];

/**
 * The gear's Session settings. Hosts control what everyone can do; everyone
 * else only picks their own microphone and camera.
 */
export function SessionSettingsDialog({
  open,
  onOpenChange,
  isHost,
  settings,
  onChange,
  recording,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isHost: boolean;
  settings: Settings;
  onChange: Change;
  /** The room's recording, for hosts in a live session. */
  recording?: Recording;
}) {
  const visible = sections.filter((section) => isHost || !section.hostOnly);
  const [chosen, setChosen] = React.useState<SectionId>(visible[0].id);
  const current = visible.find((section) => section.id === chosen) ?? visible[0];

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/40 transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <DialogPrimitive.Popup className="fixed top-1/2 left-1/2 z-50 flex h-[688px] max-h-[calc(100dvh-2rem)] w-[937px] max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border-default bg-surface-default text-text-primary shadow-lg outline-none transition-all data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 md:flex-row">
          <nav aria-label="Settings sections" className="flex shrink-0 flex-col gap-6 px-4 pt-6 md:w-[348px] md:px-6 md:py-8">
            <div className="flex flex-col gap-2 pr-10 md:pt-2 md:pr-0 md:pl-5">
              <DialogPrimitive.Title className="text-2xl/8 font-semibold">Session settings</DialogPrimitive.Title>
              <p className="text-base text-text-secondary max-md:hidden">
                Manage your meeting preferences
                <br />
                and session controls.
              </p>
            </div>
            {visible.length > 1 && (
              <ul className="flex gap-1 overflow-x-auto max-md:-mx-4 max-md:px-4 max-md:pb-2 md:flex-col">
                {visible.map((section) => (
                  <li key={section.id} className="shrink-0">
                    <button
                      type="button"
                      aria-current={section.id === current.id ? "true" : undefined}
                      onClick={() => setChosen(section.id)}
                      className={cn(
                        "flex h-12 w-full cursor-pointer items-center gap-3 rounded-xl px-5 text-left text-sm font-medium transition-colors [&_svg]:size-5 [&_svg]:shrink-0 [&_svg]:text-icon-secondary",
                        section.id === current.id ? "bg-surface-subtle" : "hover:bg-surface-subtle/60",
                      )}
                    >
                      {section.icon}
                      {section.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </nav>

          <section aria-labelledby="session-settings-section" className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-4 py-6 md:px-7 md:py-8">
            <header className="flex items-start gap-4">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <h2 id="session-settings-section" className="text-2xl/8 font-semibold">
                  {current.label}
                </h2>
                <p className="text-base text-text-secondary">{current.description}</p>
              </div>
              <DialogPrimitive.Close
                aria-label="Close settings"
                className="flex size-[22px] shrink-0 cursor-pointer items-center justify-center text-icon-secondary hover:text-text-primary max-md:absolute max-md:top-6 max-md:right-4"
              >
                <Cancel01 className="size-[22px]" />
              </DialogPrimitive.Close>
            </header>

            <div className="flex flex-col gap-2">
              {current.id === "permissions" && <PermissionRows settings={settings} onChange={onChange} />}
              {current.id === "access" && <AccessRows settings={settings} onChange={onChange} />}
              {current.id === "media" && <MediaRows isHost={isHost} settings={settings} onChange={onChange} />}
              {current.id === "recording" && <RecordingRows settings={settings} onChange={onChange} recording={recording} />}
            </div>
          </section>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function PermissionRows({ settings, onChange }: { settings: Settings; onChange: Change }) {
  return (
    <>
      <ToggleRow title="Allow microphone access" description="Let participants unmute themselves." checked={settings.microphone} onChange={(microphone) => onChange({ microphone })} />
      <ToggleRow title="Allow camera access" description="Let participants turn on their cameras." checked={settings.camera} onChange={(camera) => onChange({ camera })} />
      <ToggleRow title="Allow screen sharing" description="Choose who can share their screen." checked={settings.screenShare} onChange={(screenShare) => onChange({ screenShare })} />
      <ToggleRow title="Allow participant chat" description="Let participants send messages in the chat." checked={settings.chat} onChange={(chat) => onChange({ chat })} />
      <ToggleRow title="Allow reactions" description="Let participants use emoji reactions." checked={settings.reactions} onChange={(reactions) => onChange({ reactions })} />
      <ToggleRow title="Allow hand raising" description="Let participants raise their hand to speak." checked={settings.handRaising} onChange={(handRaising) => onChange({ handRaising })} />
    </>
  );
}

function AccessRows({ settings, onChange }: { settings: Settings; onChange: Change }) {
  return (
    <>
      <ToggleRow title="Lock session" description="Prevent new participants from joining" checked={settings.locked} onChange={(locked) => onChange({ locked })} />
      <ToggleRow title="Restrict to invited participants" description="Only invited participants can join" checked={settings.invitedOnly} onChange={(invitedOnly) => onChange({ invitedOnly })} />
      <ToggleRow title="Waiting room" description="Require approval before participants can join" checked={settings.waitingRoom} onChange={(waitingRoom) => onChange({ waitingRoom })} />
      <ToggleRow title="Allow participants re-entry" description="Let disconnected participants rejoin" checked={settings.reentry} onChange={(reentry) => onChange({ reentry })} />
    </>
  );
}

function MediaRows({ isHost, settings, onChange }: { isHost: boolean; settings: Settings; onChange: Change }) {
  if (!isHost) {
    return (
      <>
        <DeviceRow kind="audioinput" title="Default microphone" description="Set the default microphone for the session" />
        <DeviceRow kind="videoinput" title="Default camera" description="Set the default camera for the session" />
        <SpeakerRow />
      </>
    );
  }

  return (
    <>
      <ToggleRow title="Mute participants on entry" description="Automatically mute participants when they join" checked={settings.muteOnEntry} onChange={(muteOnEntry) => onChange({ muteOnEntry })} />
      <ToggleRow title="Allow participants to unmute" description="Let participants unmute themselves" checked={settings.microphone} onChange={(microphone) => onChange({ microphone })} />
      <DeviceRow kind="audioinput" title="Default microphone" description="Set the default microphone for the session" />
      <ToggleRow title="Allow participants cameras" description="Let participants turn on their cameras" checked={settings.camera} onChange={(camera) => onChange({ camera })} />
      <ToggleRow title="Turn off participants cameras on entry" description="Participants join with their camera off" checked={settings.camerasOffOnEntry} onChange={(camerasOffOnEntry) => onChange({ camerasOffOnEntry })} />
      <DeviceRow kind="videoinput" title="Default camera" description="Set the default camera for the session" />
      <SelectRow
        title="Default video quality"
        description="Set the default video resolution for the session"
        value={settings.videoQuality}
        options={videoQualityOptions}
        onChange={(videoQuality) => onChange({ videoQuality })}
      />
      <SpeakerRow />
    </>
  );
}

type Recording = { active: boolean; starting: boolean; error: string | null; start: () => void };

function RecordingRows({ settings, onChange, recording }: { settings: Settings; onChange: Change; recording?: Recording }) {
  return (
    <>
      {recording && (
        <Row
          title="Record this session"
          description={
            recording.error ??
            (recording.active
              ? "Recording now. It stops when the session ends."
              : "Start recording now. It runs until the session ends.")
          }
          id="record-now"
        >
          <button
            type="button"
            aria-describedby="record-now"
            disabled={recording.active || recording.starting}
            onClick={recording.start}
            className="flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-lg bg-surface-subtle px-3 text-sm font-medium text-text-primary hover:bg-neutral-200 disabled:cursor-default disabled:opacity-60"
          >
            <RecordCircle className="size-4 text-text-error" />
            {recording.active ? "Recording" : recording.starting ? "Starting…" : "Start"}
          </button>
        </Row>
      )}
      <ToggleRow title="Auto-record session" description="Automatically start recording when the session begins" checked={settings.autoRecord} onChange={(autoRecord) => onChange({ autoRecord })} />
      <SelectRow
        title="Recording visibility"
        description="Choose who can view the recording after the session"
        value={settings.recordingVisibility}
        options={recordingVisibilityOptions}
        onChange={(recordingVisibility) => onChange({ recordingVisibility })}
      />
    </>
  );
}

function Row({ title, description, id, children }: { title: string; description: string; id: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-[68px] items-center gap-6 rounded-xl border border-border-default py-3 pr-5 pl-5 md:pl-7">
      <div className="min-w-0 flex-1">
        <p id={id} className="text-base font-medium">
          {title}
        </p>
        <p className="text-[13px]/[18px] text-text-secondary">{description}</p>
      </div>
      {children}
    </div>
  );
}

function ToggleRow({ title, description, checked, onChange }: { title: string; description: string; checked: boolean; onChange: (checked: boolean) => void }) {
  const id = React.useId();
  return (
    <Row title={title} description={description} id={id}>
      <SettingsSwitch aria-labelledby={id} checked={checked} onCheckedChange={onChange} />
    </Row>
  );
}

function SelectRow<T extends string>({
  title,
  description,
  value,
  options,
  onChange,
}: {
  title: string;
  description: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  const id = React.useId();
  return (
    <Row title={title} description={description} id={id}>
      <SelectInput
        aria-label={title}
        value={value}
        onChange={onChange}
        options={[...options]}
        chevronClassName="[&_svg]:size-4"
        className={cn(settingsSelectClass, "w-[170px] shrink-0")}
      />
    </Row>
  );
}

const choiceKeys = { audioinput: "audioDeviceId", videoinput: "videoDeviceId" } as const;

/** Picks a device for this session and remembers it for the next one. */
function DeviceRow({ kind, title, description }: { kind: "audioinput" | "videoinput" | "audiooutput"; title: string; description: string }) {
  const { devices, activeDeviceId, setActiveMediaDevice } = useMediaDeviceSelect({ kind });
  const options = devices.map((device, index) => ({
    value: device.deviceId,
    label: device.deviceId === "default" ? "System default" : device.label || `Device ${index + 1}`,
  }));
  const value = options.some((option) => option.value === activeDeviceId) ? activeDeviceId : (options[0]?.value ?? "");

  return (
    <SelectRow
      title={title}
      description={description}
      value={value}
      options={options.length ? options : [{ value: "", label: "None found" }]}
      onChange={(deviceId) => {
        setActiveMediaDevice(deviceId).catch(() => {});
        if (kind !== "audiooutput") saveChoices({ ...readSavedChoices(), [choiceKeys[kind]]: deviceId });
      }}
    />
  );
}

const canPickSpeaker = () => typeof HTMLMediaElement !== "undefined" && "setSinkId" in HTMLMediaElement.prototype;
const noSubscription = () => () => {};

/** Only where the browser lets a page choose its speaker (not Safari or Firefox). */
function SpeakerRow() {
  const supported = React.useSyncExternalStore(noSubscription, canPickSpeaker, () => false);
  if (!supported) return null;
  return <DeviceRow kind="audiooutput" title="Speaker" description="Choose where you hear the session" />;
}
