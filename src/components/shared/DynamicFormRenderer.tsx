// import { useEffect } from 'react';
// import { useForm } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import { z } from 'zod';
// import { FormField } from '@/types';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Textarea } from '@/components/ui/textarea';
// import { Checkbox } from '@/components/ui/checkbox';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';
// import {
//   Form,
//   FormControl,
//   FormDescription,
//   FormField as FormFieldComponent,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from '@/components/ui/form';

// interface DynamicFormRendererProps {
//   fields: FormField[];
//   initialValues?: Record<string, unknown>;
//   onSubmit: (values: Record<string, unknown>) => void;
//   onSaveDraft?: (values: Record<string, unknown>) => void;
//   isSubmitting?: boolean;
//   isReadOnly?: boolean;
//   submitLabel?: string;
//   showDraftButton?: boolean;
// }

// // Build Zod schema dynamically based on form fields
// function buildSchema(fields: FormField[]) {
//   const schemaShape: Record<string, z.ZodTypeAny> = {};

//   fields.forEach(field => {
//     let fieldSchema: z.ZodTypeAny;

//     switch (field.type) {
//       case 'number':
//         fieldSchema = z.coerce.number();
//         break;
//       case 'checkbox':
//         fieldSchema = z.boolean();
//         break;
//       default:
//         fieldSchema = z.string();
//     }

//     if (field.required && field.type !== 'checkbox') {
//       if (field.type === 'number') {
//         fieldSchema = z.coerce.number({ required_error: `${field.label} is required` });
//       } else {
//         fieldSchema = z.string().min(1, `${field.label} is required`);
//       }
//     } else if (!field.required) {
//       if (field.type === 'number') {
//         fieldSchema = z.coerce.number().optional();
//       } else if (field.type !== 'checkbox') {
//         fieldSchema = z.string().optional();
//       }
//     }

//     schemaShape[field.id] = fieldSchema;
//   });

//   return z.object(schemaShape);
// }

// export function DynamicFormRenderer({
//   fields,
//   initialValues = {},
//   onSubmit,
//   onSaveDraft,
//   isSubmitting = false,
//   isReadOnly = false,
//   submitLabel = 'Submit Report',
//   showDraftButton = true,
// }: DynamicFormRendererProps) {
//   const schema = buildSchema(fields);
  
//   const form = useForm({
//     resolver: zodResolver(schema),
//     defaultValues: fields.reduce((acc, field) => {
//       if (field.type === 'checkbox') {
//         acc[field.id] = initialValues[field.id] ?? false;
//       } else if (field.type === 'number') {
//         acc[field.id] = initialValues[field.id] ?? '';
//       } else {
//         acc[field.id] = initialValues[field.id] ?? '';
//       }
//       return acc;
//     }, {} as Record<string, unknown>),
//   });

//   // Auto-save draft every 25 seconds
//   useEffect(() => {
//     if (isReadOnly || !onSaveDraft) return;

//     const interval = setInterval(() => {
//       const values = form.getValues();
//       onSaveDraft(values);
//     }, 25000);

//     return () => clearInterval(interval);
//   }, [form, onSaveDraft, isReadOnly]);

//   const handleSubmit = (values: Record<string, unknown>) => {
//     onSubmit(values);
//   };

//   const handleSaveDraft = () => {
//     if (onSaveDraft) {
//       onSaveDraft(form.getValues());
//     }
//   };

//   const renderField = (field: FormField) => {
//     return (
//       <FormFieldComponent
//         key={field.id}
//         control={form.control}
//         name={field.id}
//         render={({ field: formField }) => (
//           <FormItem>
//             <FormLabel>
//               {field.label}
//               {field.required && <span className="text-destructive ml-1">*</span>}
//             </FormLabel>
//             <FormControl>
//               {field.type === 'textarea' ? (
//                 <Textarea
//                   {...formField}
//                   value={formField.value as string}
//                   placeholder={field.placeholder}
//                   disabled={isReadOnly}
//                   className="min-h-[100px] resize-y"
//                 />
//               ) : field.type === 'select' ? (
//                 <Select
//                   value={formField.value as string}
//                   onValueChange={formField.onChange}
//                   disabled={isReadOnly}
//                 >
//                   <SelectTrigger>
//                     <SelectValue placeholder={field.placeholder || 'Select...'} />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {field.options?.map(option => (
//                       <SelectItem key={option.value} value={option.value}>
//                         {option.label}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               ) : field.type === 'checkbox' ? (
//                 <div className="flex items-center space-x-2">
//                   <Checkbox
//                     checked={formField.value as boolean}
//                     onCheckedChange={formField.onChange}
//                     disabled={isReadOnly}
//                   />
//                 </div>
//               ) : (
//                 <Input
//                   {...formField}
//                   value={formField.value as string}
//                   type={field.type === 'number' ? 'number' : 'text'}
//                   placeholder={field.placeholder}
//                   disabled={isReadOnly}
//                 />
//               )}
//             </FormControl>
//             <FormMessage />
//           </FormItem>
//         )}
//       />
//     );
//   };

//   return (
//     <Form {...form}>
//       <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
//         {fields.map(renderField)}

//         {!isReadOnly && (
//           <div className="flex items-center gap-4 pt-4">
//             <Button type="submit" disabled={isSubmitting}>
//               {isSubmitting ? 'Submitting...' : submitLabel}
//             </Button>
//             {showDraftButton && onSaveDraft && (
//               <Button
//                 type="button"
//                 variant="outline"
//                 onClick={handleSaveDraft}
//                 disabled={isSubmitting}
//               >
//                 Save Draft
//               </Button>
//             )}
//           </div>
//         )}


import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormField } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField as FormFieldComponent,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

interface DynamicFormRendererProps {
  fields: FormField[];
  initialValues?: Record<string, unknown>;
  onSubmit: (values: Record<string, unknown>) => void;
  onSaveDraft?: (values: Record<string, unknown>) => void;
  isSubmitting?: boolean;
  isReadOnly?: boolean;
  submitLabel?: string;
  showDraftButton?: boolean;
  showKrSelector?: boolean;
  krOptions?: Array<{ id: string; label: string }>;
  fieldKrMap?: Record<string, string | null>;
  onFieldKrChange?: (fieldId: string, krId: string | null) => void;
}

// Build Zod schema dynamically based on form fields
function buildSchema(fields: FormField[]) {
  const schemaShape: Record<string, z.ZodTypeAny> = {};

  fields.forEach(field => {
    let fieldSchema: z.ZodTypeAny;

    switch (field.type) {
      case 'number':
        fieldSchema = z.coerce.number();
        break;
      case 'checkbox':
        fieldSchema = z.boolean();
        break;
      default:
        fieldSchema = z.string();
    }

    if (field.required && field.type !== 'checkbox') {
      if (field.type === 'number') {
        fieldSchema = z.coerce.number({ required_error: `${field.label} is required` });
      } else {
        fieldSchema = z.string().min(1, `${field.label} is required`);
      }
    } else if (!field.required) {
      if (field.type === 'number') {
        fieldSchema = z.coerce.number().optional();
      } else if (field.type !== 'checkbox') {
        fieldSchema = z.string().optional();
      }
    }

    schemaShape[field.id] = fieldSchema;
  });

  return z.object(schemaShape);
}

export function DynamicFormRenderer({
  fields,
  initialValues = {},
  onSubmit,
  onSaveDraft,
  isSubmitting = false,
  isReadOnly = false,
  submitLabel = 'Submit Report',
  showDraftButton = true,
  showKrSelector = false,
  krOptions = [],
  fieldKrMap = {},
  onFieldKrChange,
}: DynamicFormRendererProps) {
  const schema = buildSchema(fields);
  
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: fields.reduce((acc, field) => {
      if (field.type === 'checkbox') {
        acc[field.id] = initialValues[field.id] ?? false;
      } else if (field.type === 'number') {
        acc[field.id] = initialValues[field.id] ?? '';
      } else {
        acc[field.id] = initialValues[field.id] ?? '';
      }
      return acc;
    }, {} as Record<string, unknown>),
  });

  // Auto-save draft every 25 seconds
  useEffect(() => {
    if (isReadOnly || !onSaveDraft) return;

    const interval = setInterval(() => {
      const values = form.getValues();
      onSaveDraft(values);
    }, 25000);

    return () => clearInterval(interval);
  }, [form, onSaveDraft, isReadOnly]);

  const handleSubmit = (values: Record<string, unknown>) => {
    onSubmit(values);
  };

  const handleSaveDraft = () => {
    if (onSaveDraft) {
      onSaveDraft(form.getValues());
    }
  };

  const renderField = (field: FormField) => {
    const extraValue = '__extra__';
    const selectedKr = fieldKrMap[field.id] ?? null;
    const selectValue = selectedKr ?? extraValue;

    return (
      <FormFieldComponent
        key={field.id}
        control={form.control}
        name={field.id}
        render={({ field: formField }) => (
          <FormItem>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <FormLabel>
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </FormLabel>
              {showKrSelector && (
                <div className="w-full sm:w-64">
                  <Select
                    value={selectValue}
                    onValueChange={(value) => {
                      if (!onFieldKrChange) return;
                      onFieldKrChange(field.id, value === extraValue ? null : value);
                    }}
                    disabled={isReadOnly || !onFieldKrChange}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Link to KR (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={extraValue}>Extra / Not linked</SelectItem>
                      {krOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <FormControl>
              {field.type === 'textarea' ? (
                <Textarea
                  {...formField}
                  value={formField.value as string}
                  placeholder={field.placeholder}
                  disabled={isReadOnly}
                  className="min-h-[100px] resize-y"
                />
              ) : field.type === 'select' ? (
                <Select
                  value={formField.value as string}
                  onValueChange={formField.onChange}
                  disabled={isReadOnly}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={field.placeholder || 'Select...'} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : field.type === 'checkbox' ? (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={formField.value as boolean}
                    onCheckedChange={formField.onChange}
                    disabled={isReadOnly}
                  />
                </div>
              ) : (
                <Input
                  {...formField}
                  value={formField.value as string}
                  type={field.type === 'number' ? 'number' : 'text'}
                  placeholder={field.placeholder}
                  disabled={isReadOnly}
                />
              )}
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {fields.map(renderField)}

        {!isReadOnly && (
          <div className="flex items-center gap-4 pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : submitLabel}
            </Button>
            {showDraftButton && onSaveDraft && (
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveDraft}
                disabled={isSubmitting}
              >
                Save Draft
              </Button>
            )}
          </div>
        )}
      </form>
    </Form>
  );
}

//       </form>
//     </Form>
//   );
// }
