import Link from "next/link";
import { Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "../actions";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center justify-between p-6">
        <Link href="/" className="flex items-center gap-2 font-medium">
          <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Landmark className="size-4" />
          </div>
          ЭТП
        </Link>
        <form action={signOut}>
          <Button type="submit" variant="ghost" size="sm">
            Выйти
          </Button>
        </form>
      </header>
      <div className="flex flex-1 items-center justify-center p-6">
        {children}
      </div>
    </div>
  );
}
