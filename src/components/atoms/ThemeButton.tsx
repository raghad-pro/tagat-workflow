"use client";
import { useTheme } from "@/providers/ThemeProvider";
import {Sun,Moon} from "@/assets/icons/icons";
import { Button } from "./Button";
export default function ThemeButton(){
  const { theme, toggleTheme } = useTheme();
return(
        <button 
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[var(--color-bg)] transition-colors ds-text-gray-100"
          onClick={toggleTheme}
        >
          {theme === "dark" ? <Sun size={20} className="text-gray-600" /> : <Moon size={20} className="text-gray-600" />}
        </button>
)
}