'use client';

import { useI18n } from '@/lib/i18n';
import type { Baby } from '@/lib/types';

interface BabyHeaderProps {
  baby: Baby;
}

export function BabyHeader({ baby }: BabyHeaderProps) {
  const { t, language } = useI18n();
  
  const birth = new Date(baby.birth_date);
  const now = new Date();
  const diffMs = now.getTime() - birth.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  let age: string;
  if (diffDays < 7) {
    age = language === 'ko' ? `${diffDays}${t('daysOld')}` : `${diffDays} ${t('daysOld')}`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    age = language === 'ko' ? `${weeks}${t('weeksOld')}` : `${weeks} ${t('weeksOld')}`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    age = language === 'ko' ? `${months}${t('monthsOld')}` : `${months} ${t('monthsOld')}`;
  } else {
    const years = Math.floor(diffDays / 365);
    age = language === 'ko' ? `${years}${t('yearsOld')}` : `${years} ${t('yearsOld')}`;
  }

  return (
    <div>
      <h1 className="text-xl font-bold">
        {baby.name} <span className="text-muted-foreground font-normal text-base">• {age}</span>
      </h1>
    </div>
  );
}
