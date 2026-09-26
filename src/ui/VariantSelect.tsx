import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import type { TuneVariant, VariantId } from '../domain/tune';
import { controlClass, labelClass } from './styles';

interface VariantSelectProps {
  variants: readonly TuneVariant[];
  value: VariantId;
  onChange: (variantId: VariantId) => void;
}

export function VariantSelect({ variants, value, onChange }: VariantSelectProps) {
  const { t } = useTranslation();
  const id = useId();

  return (
    <div className="flex flex-col items-start gap-1">
      <label htmlFor={id} className={labelClass}>
        {t('variant.label')}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => {
          const variant = variants.find((v) => v.variantId === event.target.value);
          if (variant) onChange(variant.variantId);
        }}
        className={controlClass}
      >
        {variants.map(({ variantId }) => (
          <option key={variantId} value={variantId}>
            {variantId}
          </option>
        ))}
      </select>
    </div>
  );
}
