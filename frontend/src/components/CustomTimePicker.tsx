import { useEffect, useRef, useState } from 'react';
import { Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type CustomTimePickerProps = {
  value: string;
  onChange: (time: string) => void;
  label?: string;
  defaultTime?: string;
  id?: string;
};

function parseTimeParts(time: string, fallback: string) {
  const [h, m] = (time || fallback).split(':');
  return {
    hour: (h || '12').padStart(2, '0').slice(0, 2),
    minute: (m || '00').padStart(2, '0').slice(0, 2),
  };
}

export default function CustomTimePicker({
  value,
  onChange,
  label,
  defaultTime = '12:00',
  id,
}: CustomTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const displayValue = value || defaultTime;
  const initial = parseTimeParts(value, defaultTime);
  const [selectedHour, setSelectedHour] = useState(initial.hour);
  const [selectedMinute, setSelectedMinute] = useState(initial.minute);

  useEffect(() => {
    const parts = parseTimeParts(value, defaultTime);
    setSelectedHour(parts.hour);
    setSelectedMinute(parts.minute);
  }, [value, defaultTime]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  const applyTime = (hour: string, minute: string) => {
    onChange(`${hour}:${minute}`);
    setIsOpen(false);
  };

  const inputId = id || `time-picker-${label?.replace(/\s+/g, '-').toLowerCase() || 'field'}`;

  return (
    <div className="space-y-1.5" ref={pickerRef}>
      {label ? <Label htmlFor={inputId}>{label}</Label> : null}
      <div className="relative">
        <Input
          id={inputId}
          value={displayValue}
          onClick={() => setIsOpen((open) => !open)}
          readOnly
          className="cursor-pointer pr-9"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        />
        <Clock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        {isOpen && (
          <div className="absolute z-[60] mt-1 w-full min-w-[14rem] overflow-hidden rounded-lg border bg-popover p-2 shadow-lg">
            <div className="grid grid-cols-2 gap-2">
              <div className="min-w-0">
                <div className="mb-1 text-center text-xs font-medium text-muted-foreground">Hour</div>
                <div className="h-40 overflow-y-auto overscroll-contain">
                  {hours.map((hour) => (
                    <button
                      key={hour}
                      type="button"
                      className={`w-full rounded px-1 py-1 text-center text-sm hover:bg-primary hover:text-primary-foreground ${
                        selectedHour === hour ? 'bg-primary text-primary-foreground' : ''
                      }`}
                      onClick={() => setSelectedHour(hour)}
                    >
                      {hour}
                    </button>
                  ))}
                </div>
              </div>
              <div className="min-w-0">
                <div className="mb-1 text-center text-xs font-medium text-muted-foreground">Minute</div>
                <div className="h-40 overflow-y-auto overscroll-contain">
                  {minutes.map((minute) => (
                    <button
                      key={minute}
                      type="button"
                      className={`w-full rounded px-1 py-1 text-center text-sm hover:bg-primary hover:text-primary-foreground ${
                        selectedMinute === minute ? 'bg-primary text-primary-foreground' : ''
                      }`}
                      onClick={() => {
                        setSelectedMinute(minute);
                        applyTime(selectedHour, minute);
                      }}
                    >
                      {minute}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-2 border-t pt-2">
              <div className="mb-1 text-xs font-medium text-muted-foreground">Quick select</div>
              <div className="grid grid-cols-4 gap-1">
                {(['00', '15', '30', '45'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    className="min-w-0 rounded bg-muted px-1 py-1 text-center text-[11px] hover:bg-muted/80"
                    onClick={() => {
                      setSelectedMinute(m);
                      applyTime(selectedHour, m);
                    }}
                  >
                    :{m}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
