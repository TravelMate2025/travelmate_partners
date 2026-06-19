import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TypeaheadInput } from "./typeahead-input";

describe("TypeaheadInput", () => {
  it("does not re-emit a clicked option on blur", () => {
    const onSelect = vi.fn();

    render(
      <TypeaheadInput
        label="City"
        options={["Ikeja", "Ajah"]}
        onSelect={onSelect}
        placeholder="Type city"
        allowCustomValue
      />,
    );

    const input = screen.getByPlaceholderText("Type city");
    fireEvent.focus(input);
    fireEvent.mouseDown(screen.getByRole("button", { name: "Ajah" }));
    fireEvent.blur(input);

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("Ajah");
  });

  it("does not auto-select the only match when single-match commit is disabled", () => {
    const onSelect = vi.fn();

    render(
      <TypeaheadInput
        label="City"
        options={["Ajah"]}
        onSelect={onSelect}
        placeholder="Type city"
        allowCustomValue
        autoSelectSingleMatchOnBlur={false}
      />,
    );

    const input = screen.getByPlaceholderText("Type city");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "Aj" } });
    fireEvent.blur(input);

    expect(onSelect).toHaveBeenCalledWith("Aj");
    expect(onSelect).not.toHaveBeenCalledWith("Ajah");
  });
});
