"use client";

import { motion } from "framer-motion";
import { useLocale } from "next-intl";

export default function AuthTemplate({ children }: { children: React.ReactNode }) {
  const locale = useLocale();
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <motion.div
      initial={{ opacity: 0, x: dir === 'rtl' ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}
