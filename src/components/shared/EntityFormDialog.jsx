import React, { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function buildDefaults(fields, initialData) {
  const defaults = {};
  fields.forEach((f) => {
    defaults[f.name] = initialData?.[f.name] ?? f.default ?? "";
  });
  return defaults;
}

export default function EntityFormDialog({
  open,
  onOpenChange,
  title,
  fields,
  initialData,
  onSubmit,
  isSubmitting,
}) {
  const initialFormData = useMemo(
    () => buildDefaults(fields, initialData),
    [fields, initialData]
  );

  const [formData, setFormData] = useState(initialFormData);

  const handleOpenChange = (nextOpen) => {
    if (nextOpen) {
      setFormData(buildDefaults(fields, initialData));
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {fields.map((field) => (
            <div key={field.name} className="space-y-1.5">
              <Label className="text-sm font-medium">{field.label}</Label>

              {field.type === "select" ? (
                <Select
                  value={formData[field.name] ?? ""}
                  onValueChange={(value) => handleChange(field.name, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={field.placeholder || "Select"} />
                  </SelectTrigger>
                  <SelectContent>
                    {(field.options || []).map((option) => {
                      const value =
                        typeof option === "string" ? option : option.value;
                      const label =
                        typeof option === "string" ? option : option.label;

                      return (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              ) : field.type === "textarea" ? (
                <Textarea
                  value={formData[field.name] ?? ""}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  placeholder={field.placeholder || ""}
                />
              ) : (
                <Input
                  type={field.type || "text"}
                  value={formData[field.name] ?? ""}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  placeholder={field.placeholder || ""}
                />
              )}
            </div>
          ))}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}