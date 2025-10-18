"use client";

import { MotionConfig } from "framer-motion";
import type { PropsWithChildren } from "react";

export default function MotionProvider({ children }: PropsWithChildren) {
  return (
    <MotionConfig reducedMotion="user">{children}</MotionConfig>
  );
}


