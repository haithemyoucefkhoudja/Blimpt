import { Shortcut } from "@/types/shortcut";
import { Button } from "./ui/button";

interface ShortcutItemProps {
  label: string;
  shortcut: Shortcut;
  isEditing: boolean;
  currentKeys: Shortcut;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}

export const ShortcutItem: React.FC<ShortcutItemProps> = ({
  label,
  shortcut,
  isEditing,
  currentKeys,
  onEdit,
  onSave,
  onCancel,
}) => {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div>
        <h3 className="text-lg font-semibold">{label}</h3>
        <p className="text-sm text-gray-500">
          {isEditing ? currentKeys.join("+") : shortcut.join("+")}
        </p>
      </div>
      <div>
        {isEditing ? (
          <div className="flex gap-2">
            <Button onClick={onSave}>Save</Button>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button onClick={onEdit}>Edit</Button>
        )}
      </div>
    </div>
  );
};