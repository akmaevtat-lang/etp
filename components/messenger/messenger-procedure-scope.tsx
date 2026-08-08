"use client";

import { useEffect } from "react";
import { useMessenger } from "@/components/messenger/messenger-provider";

// Mounted on the procedure page so the global messenger panel scopes its
// thread list down to this procedure while it's on screen, per
// docs/TZ_ZAKUPKI.md §6: "мессенджер процедуры — постоянная соседняя
// панель", filtered by procedureId, not a separate widget.
export function MessengerProcedureScope({ procedureId }: { procedureId: string }) {
  const { setProcedureFilter } = useMessenger();

  useEffect(() => {
    setProcedureFilter(procedureId);
    return () => setProcedureFilter(null);
  }, [procedureId, setProcedureFilter]);

  return null;
}
