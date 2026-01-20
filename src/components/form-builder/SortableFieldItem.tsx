import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FormField, FieldType } from '@/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GripVertical, Pencil, Trash2, Type, AlignLeft, Hash, ListFilter, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SortableFieldItemProps {
  field: FormField;
  onEdit: (field: FormField) => void;
  onDelete: (fieldId: string) => void;
  isInteractive?: boolean;
}

const fieldTypeIcons: Record<FieldType, React.ReactNode> = {
  text: <Type className="h-4 w-4" />,
  textarea: <AlignLeft className="h-4 w-4" />,
  number: <Hash className="h-4 w-4" />,
  select: <ListFilter className="h-4 w-4" />,
  checkbox: <CheckSquare className="h-4 w-4" />,
};

const fieldTypeLabels: Record<FieldType, string> = {
  text: 'Short Text',
  textarea: 'Long Text',
  number: 'Number',
  select: 'Dropdown',
  checkbox: 'Checkbox',
};

export function SortableFieldItem({ field, onEdit, onDelete, isInteractive = true }: SortableFieldItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id, disabled: !isInteractive });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        'p-4 flex items-center gap-4 group',
        isDragging && 'opacity-50 shadow-lg ring-2 ring-primary',
        isInteractive && 'cursor-grab active:cursor-grabbing'
      )}
    >
      {isInteractive && (
        <div {...attributes} {...listeners} className="text-muted-foreground hover:text-foreground">
          <GripVertical className="h-5 w-5" />
        </div>
      )}

      <div className="flex items-center gap-2 text-muted-foreground">
        {fieldTypeIcons[field.type]}
        <span className="text-xs">{fieldTypeLabels[field.type]}</span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">
          {field.label}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </p>
        {field.placeholder && (
          <p className="text-sm text-muted-foreground truncate">{field.placeholder}</p>
        )}
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(field)}
          className="h-8 w-8"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(field.id)}
          className="h-8 w-8 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
