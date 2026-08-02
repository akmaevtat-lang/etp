import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MarketingPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">
        Электронная торговая площадка с ИИ
      </h1>
      <p className="max-w-md text-muted-foreground">
        Организатор проводит закупки и продажи, участники подают предложения,
        а ИИ помогает на всех этапах — от ТЗ до протокола.
      </p>
      <div className="flex gap-3">
        <Button nativeButton={false} render={<Link href="/register" />}>
          Начать бесплатно
        </Button>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/login" />}
        >
          Войти
        </Button>
      </div>
    </main>
  );
}
