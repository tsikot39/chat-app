import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

describe("Basic Test Suite", () => {
  it("should pass a basic test", () => {
    expect(true).toBe(true);
  });

  it("should render a simple element", () => {
    render(<div data-testid="test-element">Hello World</div>);
    expect(screen.getByTestId("test-element")).toBeInTheDocument();
  });
});
