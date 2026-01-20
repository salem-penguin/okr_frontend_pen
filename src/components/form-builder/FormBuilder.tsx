import { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { FormField } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { SortableFieldItem } from './SortableFieldItem';
import { FormFieldEditor } from './FormFieldEditor';
import { FormPreview } from './FormPreview';
import { Plus, GripVertical, List, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface FormBuilderProps {
  initialFields: FormField[];
  onSave: (fields: FormField[]) => Promise<void>;
  title: string;
  description: string;
}

export function FormBuilder({ initialFields, onSave, title, description }: FormBuilderProps) {
  const [fields, setFields] = useState<FormField[]>(initialFields);
  const [editingField, setEditingField] = useState<FormField | undefined>();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [mode, setMode] = useState<'basic' | 'interactive'>('interactive');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setFields((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }, []);

  const handleAddField = () => {
    setEditingField(undefined);
    setIsEditorOpen(true);
  };

  const handleEditField = (field: FormField) => {
    setEditingField(field);
    setIsEditorOpen(true);
  };

  const handleDeleteField = (fieldId: string) => {
    setFields(fields.filter((f) => f.id !== fieldId));
    toast.success('Field deleted');
  };

  const handleSaveField = (field: FormField) => {
    if (editingField) {
      setFields(fields.map((f) => (f.id === field.id ? field : f)));
      toast.success('Field updated');
    } else {
      setFields([...fields, field]);
      toast.success('Field added');
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setFields(arrayMove(fields, index, index - 1));
  };

  const handleMoveDown = (index: number) => {
    if (index === fields.length - 1) return;
    setFields(arrayMove(fields, index, index + 1));
  };

  const handleSave = async () => {
    if (fields.length === 0) {
      toast.error('Please add at least one field');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(fields);
      toast.success('Form saved successfully');
    } catch (error) {
      toast.error('Failed to save form');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </div>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Form
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={mode} onValueChange={(v) => setMode(v as 'basic' | 'interactive')}>
              <TabsList className="mb-4">
                <TabsTrigger value="basic" className="flex items-center gap-2">
                  <List className="h-4 w-4" />
                  Basic Mode
                </TabsTrigger>
                <TabsTrigger value="interactive" className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4" />
                  Drag & Drop
                </TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-3">
                {fields.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No fields yet. Click "Add Field" to get started.</p>
                  </div>
                ) : (
                  fields.map((field, index) => (
                    <Card key={field.id} className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0}
                          >
                            ▲
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleMoveDown(index)}
                            disabled={index === fields.length - 1}
                          >
                            ▼
                          </Button>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">
                            {field.label}
                            {field.required && <span className="text-destructive ml-1">*</span>}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {field.type.charAt(0).toUpperCase() + field.type.slice(1)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditField(field)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteField(field.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="interactive" className="space-y-3">
                {fields.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No fields yet. Click "Add Field" to get started.</p>
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={fields.map((f) => f.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {fields.map((field) => (
                        <SortableFieldItem
                          key={field.id}
                          field={field}
                          onEdit={handleEditField}
                          onDelete={handleDeleteField}
                          isInteractive={true}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                )}
              </TabsContent>
            </Tabs>

            <Button onClick={handleAddField} className="w-full mt-4" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Field
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1">
        <FormPreview fields={fields} />
      </div>

      <FormFieldEditor
        field={editingField}
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveField}
      />
    </div>
  );
}
