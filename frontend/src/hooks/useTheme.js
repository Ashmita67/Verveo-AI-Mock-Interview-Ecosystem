import { useEffect, useState } from "react";
import { readStorage, storageKeys, writeStorage } from "@/utils/storage";

export function useTheme() {
  const [theme, setTheme] = useState(() => readStorage(storageKeys.theme, "light"));

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    writeStorage(storageKeys.theme, theme);
  }, [theme]);

  return {
    theme,
    toggleTheme: () => setTheme((current) => (current === "dark" ? "light" : "dark")),
  };
}
