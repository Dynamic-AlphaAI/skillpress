import * as Select from "@radix-ui/react-select";
import { memo, useId, useRef, type RefObject } from "react";
import { LibraryIcon } from "./LibraryIcons";
import s from "./WalkingRoom.module.css";

interface RoomPickerProps {
  label: string;
  accessibleLabel: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  side?: "top" | "bottom";
  portalContainer?: HTMLElement | null;
  walkCanvas?: RefObject<HTMLCanvasElement | null>;
}

export const RoomPicker = memo(function RoomPicker({
  label, accessibleLabel, value, options, onChange, walkCanvas, portalContainer, side = "top",
}: RoomPickerProps) {
  const id = useId();
  const pointerSelection = useRef(false);

  return (
    <div className={s.field}>
      <label htmlFor={id}>{label}</label>
      <Select.Root value={value} onValueChange={onChange} disabled={!options.length}>
        <Select.Trigger id={id} className={s.trigger} aria-label={accessibleLabel}>
          <span className={s.value}><Select.Value /></span>
          <Select.Icon className={s.chevron}><LibraryIcon name="down" size={18} /></Select.Icon>
        </Select.Trigger>
        <Select.Portal container={portalContainer}>
          <Select.Content
            className={s.menu}
            aria-label={accessibleLabel}
            position="popper"
            side={side}
            align="start"
            sideOffset={6}
            collisionPadding={10}
            onCloseAutoFocus={(event) => {
              // A pointer shelf visit resumes walking. Keyboard users can Tab straight to Volume.
              if (pointerSelection.current && walkCanvas?.current) {
                event.preventDefault();
                walkCanvas.current.focus({ preventScroll: true });
              }
              pointerSelection.current = false;
            }}
          >
            <div className={s.scrollSlot}>
              <Select.ScrollUpButton className={s.scrollUp}><LibraryIcon name="down" size={16} /></Select.ScrollUpButton>
            </div>
            <Select.Viewport className={s.choices}>
              {options.map((option) => (
                <Select.Item
                  key={option.value}
                  className={s.choice}
                  value={option.value}
                  textValue={option.label}
                  onPointerUp={() => { pointerSelection.current = true; }}
                  onKeyDown={() => { pointerSelection.current = false; }}
                >
                  <Select.ItemText>{option.label}</Select.ItemText>
                  <Select.ItemIndicator className={s.check}><LibraryIcon name="check" size={16} /></Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Viewport>
            <div className={s.scrollSlot}>
              <Select.ScrollDownButton className={s.scrollDown}><LibraryIcon name="down" size={16} /></Select.ScrollDownButton>
            </div>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  );
});
