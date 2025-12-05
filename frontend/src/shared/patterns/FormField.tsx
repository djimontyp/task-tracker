/**
 * FormField - Form field wrapper with label, input, and error
 *
 * A consistent pattern for form fields with validation feedback.
 * Works with react-hook-form and standalone inputs.
 *
 * @example
 * // With react-hook-form
 * <FormField
 *   label="Email"
 *   error={errors.email?.message}
 *   required
 * >
 *   <Input {...register('email')} type="email" />
 * </FormField>
 *
 * // Standalone
 * <FormField label="Name" description="Your full name">
 *   <Input value={name} onChange={e => setName(e.target.value)} />
 * </FormField>
 */

import type { ReactNode } from 'react';
import { Label } from '@/shared/ui/label';
import { cn } from '@/shared/lib/utils';
import { forms } from '@/shared/tokens';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface FormFieldProps {
  /** Field label text */
  label: string;
  /** Unique field ID (for label association) */
  id?: string;
  /** Show required indicator (*) */
  required?: boolean;
  /** Error message (from validation) */
  error?: string;
  /** Helper text below input */
  description?: string;
  /** The input element */
  children: ReactNode;
  /** Additional className for wrapper */
  className?: string;
  /** Disable the entire field */
  disabled?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export function FormField({
  label,
  id,
  required = false,
  error,
  description,
  children,
  className,
  disabled = false,
}: FormFieldProps) {
  const hasError = !!error;

  return (
    <div className={cn(forms.field, disabled && 'opacity-50', className)}>
      {/* Label */}
      <Label
        htmlFor={id}
        className={cn(
          required ? forms.label.required : forms.label.default,
          hasError && 'text-destructive'
        )}
      >
        {label}
      </Label>

      {/* Input (passed as children) */}
      <div className={cn(hasError && '[&>*]:border-destructive [&>*]:focus-visible:ring-destructive')}>
        {children}
      </div>

      {/* Error message */}
      {hasError && (
        <p className={forms.error} role="alert">
          {error}
        </p>
      )}

      {/* Description/helper text (only if no error) */}
      {!hasError && description && (
        <p className={forms.help}>{description}</p>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// VARIANT: Inline Form Field (label beside input)
// ═══════════════════════════════════════════════════════════════

export interface InlineFormFieldProps extends Omit<FormFieldProps, 'className'> {
  /** Label width (Tailwind class) */
  labelWidth?: string;
  /** Additional className for wrapper */
  className?: string;
}

export function InlineFormField({
  label,
  id,
  required = false,
  error,
  description,
  children,
  labelWidth = 'w-32',
  className,
  disabled = false,
}: InlineFormFieldProps) {
  const hasError = !!error;

  return (
    <div className={cn('flex items-start gap-4', disabled && 'opacity-50', className)}>
      {/* Label */}
      <Label
        htmlFor={id}
        className={cn(
          labelWidth,
          'shrink-0 pt-2',
          required ? forms.label.required : forms.label.default,
          hasError && 'text-destructive'
        )}
      >
        {label}
      </Label>

      {/* Input container */}
      <div className="flex-1">
        <div className={cn(hasError && '[&>*]:border-destructive')}>
          {children}
        </div>

        {hasError && (
          <p className={forms.error} role="alert">
            {error}
          </p>
        )}

        {!hasError && description && (
          <p className={forms.help}>{description}</p>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// HELPER: Form Section (group of fields)
// ═══════════════════════════════════════════════════════════════

export interface FormSectionProps {
  /** Section title */
  title?: string;
  /** Section description */
  description?: string;
  /** Form fields */
  children: ReactNode;
  /** Additional className */
  className?: string;
}

export function FormSection({
  title,
  description,
  children,
  className,
}: FormSectionProps) {
  return (
    <div className={cn(forms.section, className)}>
      {(title || description) && (
        <div className="mb-4">
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
          {description && (
            <p className="text-sm text-muted-foreground mt-2">{description}</p>
          )}
        </div>
      )}
      <div className={forms.section}>{children}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// HELPER: Form Actions (buttons container)
// ═══════════════════════════════════════════════════════════════

export interface FormActionsProps {
  children: ReactNode;
  /** Alignment */
  align?: 'left' | 'right' | 'center' | 'between';
  /** Additional className */
  className?: string;
}

const alignClasses = {
  left: 'justify-start',
  right: 'justify-end',
  center: 'justify-center',
  between: 'justify-between',
} as const;

export function FormActions({
  children,
  align = 'right',
  className,
}: FormActionsProps) {
  return (
    <div className={cn('flex items-center gap-4 pt-4', alignClasses[align], className)}>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// HELPER: Fieldset (grouped fields with border)
// ═══════════════════════════════════════════════════════════════

export interface FieldsetProps {
  /** Fieldset legend */
  legend: string;
  /** Form fields */
  children: ReactNode;
  /** Additional className */
  className?: string;
}

export function Fieldset({ legend, children, className }: FieldsetProps) {
  return (
    <fieldset className={cn('border border-border rounded-lg p-4', className)}>
      <legend className="text-sm font-medium px-2">{legend}</legend>
      <div className={forms.section}>{children}</div>
    </fieldset>
  );
}
