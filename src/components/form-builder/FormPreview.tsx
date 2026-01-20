import { FormField } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';

interface FormPreviewProps {
  fields: FormField[];
  title?: string;
}

export function FormPreview({ fields, title = 'Form Preview' }: FormPreviewProps) {
  const renderPreviewField = (field: FormField) => {
    return (
      <div key={field.id} className="space-y-2">
        <Label>
          {field.label}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>

        {field.type === 'textarea' ? (
          <Textarea
            placeholder={field.placeholder}
            disabled
            className="min-h-[80px] resize-none"
          />
        ) : field.type === 'select' ? (
          <Select disabled>
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
            <Checkbox disabled />
            <span className="text-sm text-muted-foreground">{field.placeholder || 'Check this box'}</span>
          </div>
        ) : (
          <Input
            type={field.type === 'number' ? 'number' : 'text'}
            placeholder={field.placeholder}
            disabled
          />
        )}
      </div>
    );
  };

  return (
    <Card className="sticky top-4">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Eye className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Add fields to see the preview
          </p>
        ) : (
          <>
            {fields.map(renderPreviewField)}
            <div className="pt-4 flex gap-2">
              <Button disabled>Submit Report</Button>
              <Button variant="outline" disabled>Save Draft</Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
