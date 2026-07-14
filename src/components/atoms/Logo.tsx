"use client";

import Image from "next/image";
import { useTheme } from "@/providers/ThemeProvider";
import {logoDark , logoLight} from "@/assets/images/images";


export default function Logo() {
  const { theme } = useTheme();

  return (
    <Image
      src={theme === "dark" ? logoDark : logoLight}
      alt="Workflow"
      width={220}
      height={60}
      className="w-full h-auto max-w-[150px] sm:max-w-[190px] mx-auto transform scale-[1.15] origin-center"
      priority
    />
  );
}