import { FC, useEffect } from "react";
import { useFormikField } from "../../hooks/UseFormikField";
import { Form } from "react-bootstrap";

type ISelectItem = { label: string | number; value: string | number };

type Prop = {
  name: string;
  label: string;
  width?: string;
  selectItems: Array<ISelectItem>;
  getValue?: (value: any) => void;
  size?: "small" | "medium";
};

export const SelectInputField: FC<Prop> = ({
  name,
  label,
  selectItems,
  getValue,
  size = "medium",
  width = "100%",
}) => {
  const { value, handleChange, hasError } = useFormikField(name);

  useEffect(() => {
    if (getValue) {
      getValue(value);
    }
  }, [value, getValue]);

  return (
    <div style={{ width, marginBottom: "15px" }}>
      <Form.Group>
        <Form.Label
          style={{ fontWeight: "bold", fontSize: "14px", color: "#4CAF50" }}
        >
          {label}
        </Form.Label>

        <Form.Control
          as="select"
          name={name}
          value={value}
          onChange={(e) =>
            handleChange({ target: { name, value: e.target.value } })
          }
          isInvalid={hasError}
          size={size === "small" ? "sm" : undefined}
          style={{
            backgroundColor: "white",
            borderRadius: "5px",
            borderColor: hasError ? "#dc3545" : "#ccc",
            padding: "0.375rem 0.75rem",
            width: "100%",
            height: "45px",
          }}
        >
          <option value="" hidden />
          {selectItems.map((item) => (
            <option value={item.value} key={item.value}>
              {item.label}
            </option>
          ))}
        </Form.Control>

        {hasError && (
          <Form.Control.Feedback type="invalid" style={{ fontSize: "12px" }}>
            This field is required.
          </Form.Control.Feedback>
        )}
      </Form.Group>
    </div>
  );
};
