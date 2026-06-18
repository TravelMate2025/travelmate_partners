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
});
