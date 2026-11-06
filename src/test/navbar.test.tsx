import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import Navbar from "@/components/Navbar";
import { visibleSections } from "@/data/sections";

describe("Navbar", () => {
  it("lists exactly the visible sections", () => {
    render(<Navbar />);
    const primary = screen.getByRole("navigation", { name: "Primary" });
    const labels = Array.from(primary.querySelectorAll("a")).map((a) => a.textContent);
    expect(labels).toEqual(visibleSections.map((s) => s.label));
  });

  it("has a skip link to the main content", () => {
    render(<Navbar />);
    expect(screen.getByRole("link", { name: "Skip to content" })).toHaveAttribute("href", "#main");
  });

  it("mobile menu: opens, moves focus in, closes on Escape and returns focus", () => {
    render(<Navbar />);
    const button = screen.getByRole("button", { name: "Open menu" });
    expect(button).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    const mobile = screen.getByRole("navigation", { name: "Mobile" });
    expect(mobile.querySelector("a")).toHaveFocus();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveFocus();
  });
});
