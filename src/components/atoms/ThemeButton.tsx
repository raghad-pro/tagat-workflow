"use client";
import { useTheme } from "@/providers/ThemeProvider";
import {Sun,Moon} from "@/assets/icons/icons";
import { Button } from "./Button";
export default function ThemeButton(){
  const { theme, toggleTheme } = useTheme();
return(
        <button className="p-2 hover:ds-bg-primary-200 transition-colors"
            onClick={toggleTheme}
            
          >
              {theme === "dark" ?  <Sun />:<Moon /> }
          </button>
)
}