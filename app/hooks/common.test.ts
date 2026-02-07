import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { useLocalStorage } from "./common";

describe("useLocalStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns initial value and persists updates", () => {
    const { result } = renderHook(() => useLocalStorage("test_key", "init"));
    expect(result.current[0]).toBe("init");

    act(() => {
      result.current[1]("next");
    });

    expect(JSON.parse(localStorage.getItem("test_key") ?? "null")).toBe("next");
  });

  it("hydrates from localStorage", () => {
    localStorage.setItem("test_key", JSON.stringify("stored"));
    const { result } = renderHook(() => useLocalStorage("test_key", "init"));
    expect(result.current[0]).toBe("stored");
  });
});
