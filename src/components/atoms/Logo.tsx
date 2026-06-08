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
      width={250}
      height={0}
      priority
    />
  );
}