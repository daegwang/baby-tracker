'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface DatePickerProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function DatePicker({ selectedDate, onDateChange }: DatePickerProps) {
  const isToday = selectedDate.toDateString() === new Date().toDateString();

  const goToPreviousDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    onDateChange(prev);
  };

  const goToNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    onDateChange(next);
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  const handleDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value);
    if (!isNaN(date.getTime())) {
      onDateChange(date);
    }
  };

  return (
    <div className="flex items-center gap-2 mb-6">
      <Button variant="outline" size="sm" onClick={goToPreviousDay}>
        ←
      </Button>
      
      <Input
        type="date"
        value={selectedDate.toISOString().split('T')[0]}
        onChange={handleDateInput}
        className="flex-1"
      />
      
      <Button variant="outline" size="sm" onClick={goToNextDay}>
        →
      </Button>
      
      {!isToday && (
        <Button variant="outline" size="sm" onClick={goToToday}>
          Today
        </Button>
      )}
    </div>
  );
}
