"use client";

import { MessageCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMessenger } from "@/components/messenger/messenger-provider";

export function MessengerToggle() {
  const { isOpen, toggle } = useMessenger();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-pressed={isOpen}
      className="aria-[pressed=true]:bg-muted"
      onClick={toggle}
    >
      <MessageCircleIcon />
      <span className="sr-only">Сообщения</span>
    </Button>
  );
}
