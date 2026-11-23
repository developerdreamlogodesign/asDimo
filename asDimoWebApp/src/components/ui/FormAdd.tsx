import React, { useEffect, useState } from "react";
import PlaceholderImage from "../../assets/Images/PlaceholderImage.svg";
import { Heading2 } from "./HeadingPara";
import DashboardButtons from "./Buttons";
import { ChevronDown } from "lucide-react";

export type Field = {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  width?: "half" | "full" | "quarter";
  fieldType?: "input" | "select" | "checkbox";
  required?: boolean;
  multiple?: boolean;
  options?: {
    label: string;
    value: string;
  }[];
  readOnly?: boolean;
  value?: string | string[] | boolean;
  icon?: React.ReactNode;
  showWhen?: {
    field: string;
    value: string;
  };
};

interface ProfileFormProps {
  fields: Field[];
  showProfilePicture?: boolean;
  heading?: string;
  onSubmit: (data: Record<string, any>) => void | Promise<void>;
  onChange?: (data: Record<string, any>) => void;
  buttonText?: string;
  loadingText?: string;
  buttonVariant?: string;
  buttonWidth?: string;
  showSubmitButton?: boolean;
}

const ProfileForm: React.FC<ProfileFormProps> = ({
  fields,
  showProfilePicture = true,
  onSubmit,
  onChange,
  heading,
  buttonText = "Add",
  loadingText = "Adding...",
  showSubmitButton = true,
}) => {
  const getInitialData = () => {
    const initial: Record<string, any> = {};

    fields.forEach((field) => {
      if (field.value !== undefined) {
        initial[field.name] = field.value;
      } else if (field.fieldType === "checkbox") {
        initial[field.name] = [];
      }
    });

    return initial;
  };

  const [formData, setFormData] = useState<Record<string, any>>(
    getInitialData
  );
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFormData((prev) => {
      const updated = { ...prev };
      let changed = false;

      fields.forEach((field) => {
        if (
          field.value !== undefined &&
          updated[field.name] !== field.value
        ) {
          updated[field.name] = field.value;
          changed = true;
        }

        if (
          field.fieldType === "checkbox" && !Array.isArray(updated[field.name]) &&
          updated[field.name] !== field.value
        ) {
          updated[field.name] = [];
          changed = true;
        }
      });

      return changed ? updated : prev;
    });
  }, [fields]);

  const isFieldVisible = (
    field: Field,
    data = formData
  ): boolean => {
    if (!field.showWhen) return true;

    const currentVal =
      data[field.showWhen.field] ??
      fields.find(
        (f) => f.name === field.showWhen?.field
      )?.value;

    return currentVal === field.showWhen.value;
  };

  const updateFormData = (name: string, value: any) => {
    const nextFormData = {
      ...formData,
      [name]: value,
    };

    fields.forEach((field) => {
      if (!isFieldVisible(field, nextFormData)) {
        delete nextFormData[field.name];
      }
    });

    setFormData(nextFormData);
    onChange?.(nextFormData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    updateFormData(e.target.name, e.target.value);
  };

  const handleSelectChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const {
      name,
      options: selectOptions,
      multiple,
      value,
    } = e.target;

    if (multiple) {
      const selectedValues = Array.from(selectOptions)
        .filter((option) => option.selected)
        .map((option) => option.value);

      updateFormData(name, selectedValues);
      return;
    }

    updateFormData(name, value);
  };

  const handleCheckboxChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value, checked } = e.target;

    const currentValues = Array.isArray(formData[name])
      ? formData[name]
      : [];

    const updatedValues = checked
      ? [...currentValues, value]
      : currentValues.filter(
          (item: string) => item !== value
        );

    updateFormData(name, updatedValues);
  };

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (file) {
      setFormData((prev) => {
        const updated = {
          ...prev,
          profileImage: file,
        };

        onChange?.(updated);
        return updated;
      });

      setPreview(URL.createObjectURL(file));
    }
  };

  const renderField = (field: Field) => {
    const commonLabel = (
      <label
        htmlFor={field.name}
        className={
          field.icon
            ? "profile-field-label has-field-icon"
            : ""
        }
      >
        {field.icon && (
          <span className="profile-field-icon">
            {field.icon}
          </span>
        )}

        <span>
          {field.label}
          {field.required && (
            <span className="required-star">*</span>
          )}
        </span>
      </label>
    );

    return (
      <div
        className={`form-group ${
          field.width === "half"
            ? "half-width"
            : field.width === "quarter"
            ? "quarter-width"
            : "full-width"
        }`}
        key={field.name}
      >
        {field.fieldType !== "checkbox" && commonLabel}

        {field.fieldType === "checkbox" ? (
          <div className="checkbox-field">
            {commonLabel}
            <div className="custom-checkbox-dropdown">
              <div
                className="dropdown-control"
                onClick={() =>
                  setOpenDropdown(
                    openDropdown === field.name ? null : field.name
                  )
                }
              >
                <span>
                  {Array.isArray(formData[field.name]) &&
                  formData[field.name].length > 0
                    ? formData[field.name].join(", ")
                    : `Select ${field.label}`}
                </span>

                <span
                  className={`dropdown-arrow ${
                    openDropdown === field.name ? "active" : ""
                  }`}
                >
                  <ChevronDown size={15}/>
                </span>
              </div>

              {openDropdown === field.name && (
                <div className="checkbox-dropdown-options">
                  {field.options?.map((option) => {
                    const currentValues = Array.isArray(formData[field.name])
                      ? formData[field.name]
                      : [];

                    return (
                      <label key={option.value} className="checkbox-option">
                        <span>{option.label}</span>
                        <input
                          type="checkbox"
                          name={field.name}
                          value={option.value}
                          checked={currentValues.includes(option.value)}
                          onChange={handleCheckboxChange}
                          disabled={field.readOnly}
                        />
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : field.fieldType === "select" ? (
          <select
            id={field.name}
            name={field.name}
            multiple={field.multiple}
            value={
              field.multiple
                ? Array.isArray(formData[field.name])
                  ? formData[field.name]
                  : []
                : formData[field.name] ?? field.value ?? ""
            }
            onChange={handleSelectChange}
            required={field.required && !field.multiple}
            disabled={field.readOnly}
          >
            {!field.multiple && (
              <option value="">
                {field.placeholder ||
                  `Select ${field.label}`}
              </option>
            )}

            {field.options?.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            id={field.name}
            name={field.name}
            type={field.type || "text"}
            placeholder={field.placeholder}
            value={
              formData[field.name] ?? field.value ?? ""
            }
            onChange={handleChange}
            required={field.required}
            readOnly={field.readOnly}
          />
        )}
      </div>
    );
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    // Validate required checkbox groups.
    const visibleRequiredCheckbox = fields.find(
      (field) =>
        field.fieldType === "checkbox" &&
        field.required &&
        isFieldVisible(field) &&
        (!Array.isArray(formData[field.name]) ||
          formData[field.name].length === 0)
    );

    if (visibleRequiredCheckbox) {
      alert(
        `Please select at least one ${visibleRequiredCheckbox.label}.`
      );
      return;
    }

    try {
      setIsSubmitting(true);

      const defaults = getInitialData();

      await onSubmit({
        ...defaults,
        ...formData,
      });
    } catch (error) {
      console.error("Form submission failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      className="add_information"
      onSubmit={handleSubmit}
    >
      {showProfilePicture && (
        <div className="top-section">
          <div className="profile-upload">
            <label htmlFor="profile-image">
              <img
                src={preview || PlaceholderImage}
                alt="Profile"
                className="profile-preview"
              />
            </label>

            <input
              id="profile-image"
              type="file"
              accept="image/*"
              hidden
              onChange={handleImageChange}
            />
          </div>

          <div className="right-fields">
            {heading && <Heading2 text={heading} />}

            {fields
              .filter((field) => isFieldVisible(field))
              .filter(
                (field) =>
                  field.name === "name" ||
                  field.name === "email"
              )
              .map(renderField)}
          </div>
        </div>
      )}

      {!showProfilePicture && heading && (
        <Heading2 text={heading} />
      )}

      <div className="bottom-fields">
        {fields
          .filter((field) => isFieldVisible(field))
          .filter(
            (field) =>
              field.name !== "name" &&
              field.name !== "email"
          )
          .map(renderField)}
      </div>

      {showSubmitButton && (
        <div className="submit-section">
          <DashboardButtons
            text={
              isSubmitting ? loadingText : buttonText
            }
            type="submit"
            variant="neon"
            disabled={isSubmitting}
          />
        </div>
      )}
    </form>
  );
};

export default ProfileForm;
