"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { submitProposal } from "@/app/(platform)/(dashboard)/procedures/actions";

export function SubmitProposalButton({ procedureId }: { procedureId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    startTransition(async () => {
      try {
        await submitProposal(procedureId);
        router.refresh();
      } catch {
        toast.error("Не удалось подать заявку");
      }
    });
  }

  return (
    <Button onClick={handleClick} disabled={isPending}>
      {isPending ? "Отправка..." : "Подать заявку"}
    </Button>
  );
}
