import { useState } from 'react';
import { FormField } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FormFieldEditor } from './FormFieldEditor';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ExtraFieldsBuilderProps {
  extraFields: FormField[];
  onExtraFieldsChange: (fields: FormField[]) => void;
  disabled?: boolean;
}

export function ExtraFieldsBuilder({
  extraFields,
  onExtraFieldsChange,
  disabled = false,
}: ExtraFieldsBuilderProps) {
  const [isOpen, setIsOpen] = useState(extraFields.length > 0);
  const [editingField, setEditingField] = useState<FormField | undefined>();
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const handleAddField = () => {
    setEditingField(undefined);
    setIsEditorOpen(true);
  };

  const handleEditField = (field: FormField) => {
    setEditingField(field);
    setIsEditorOpen(true);
  };

  const handleDeleteField = (fieldId: string) => {
    onExtraFieldsChange(extraFields.filter((f) => f.id !== fieldId));
  };

  const handleSaveField = (field: FormField) => {
    if (editingField) {
      onExtraFieldsChange(extraFields.map((f) => (f.id === field.id ? field : f)));
    } else {
      // Mark extra fields with a prefix to distinguish them
      const extraField = { ...field, id: `extra_${field.id}` };
      onExtraFieldsChange([...extraFields, extraField]);
    }
  };

  if (disabled) return null;

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Extra Information (Optional)
                  </CardTitle>
                  <CardDescription>
                    Add custom fields beyond the required form
                  </CardDescription>
                </div>
                {isOpen ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              {extraFields.length > 0 && (
                <div className="space-y-2 mb-4">
                  {extraFields.map((field) => (
                    <div
                      key={field.id}
                      className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{field.label}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {field.type.replace('_', ' ')}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditField(field)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteField(field.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddField}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Extra Field
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <FormFieldEditor
        field={editingField}
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveField}
      />
    </>
  );
}
