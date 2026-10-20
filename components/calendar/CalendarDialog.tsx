import { Cancel01 } from "@/assets/icons";
import { Button } from "@/components/ui/button";
import { DialogClose, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function CalendarDialogHeader({
  title,
  className,
}: {
  title: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <DialogTitle className="text-xl leading-7 font-semibold text-text-primary">
        {title}
      </DialogTitle>
      <DialogClose
        aria-label="Close"
        className="flex size-10 items-center justify-center rounded-lg bg-white text-text-primary hover:bg-neutral-100"
      >
        <Cancel01 className="size-5" />
      </DialogClose>
    </div>
  );
}

export function CalendarDialogActions({
  submitLabel,
  disabled,
  className,
  children,
}: {
  submitLabel: string;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("flex items-center justify-end gap-4", className)}>
      {children}
      <DialogClose
        render={
          <Button
            variant="secondary"
            size="lg"
            className="border-neutral-200 text-base font-normal text-text-secondary"
          />
        }
      >
        Cancel
      </DialogClose>
      <Button
        type="submit"
        size="lg"
        disabled={disabled}
        className="text-base disabled:bg-brand-200 disabled:text-white"
      >
        {submitLabel}
      </Button>
    </div>
  );
}
