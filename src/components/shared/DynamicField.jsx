import React from "react";

export default function DynamicField({ field, value, onChange }) {
  const commonProps = {
    className: "border rounded-lg px-3 py-2 w-full",
    value: value ?? "",
    onChange: (e) => onChange(field.field_key, e.target.value),
  };

  if (field.field_type === "textarea") {
    return <textarea {...commonProps} rows={4} />;
  }

  if (field.field_type === "select") {
    const options =
      field.field_key === "status"
        ? ["active", "inactive", "prospect", "open", "closed"]
        : [];

    return (
      <select {...commonProps}>
        <option value="">Select</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }

  if (field.field_type === "checkbox") {
    return (
      <input
        type="checkbox"
        checked={!!value}
        onChange={(e) => onChange(field.field_key, e.target.checked)}
      />
    );
  }

  const inputTypeMap = {
    email: "email",
    phone: "text",
    number: "number",
    date: "date",
    datetime: "datetime-local",
    url: "url",
    text: "text",
  };

  return <input type={inputTypeMap[field.field_type] || "text"} {...commonProps} />;
}