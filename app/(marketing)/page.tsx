import Link from "next/link";
import {
  Landmark,
  ShoppingCartIcon,
  UsersIcon,
  MessageCircleIcon,
  BotIcon,
  BarChart3Icon,
  LayoutGridIcon,
  ArrowRightIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const FEATURES = [
  {
    icon: ShoppingCartIcon,
    title: "Закупки и продажи",
    description:
      "Публикуйте процедуры, ведите статус от черновика до завершения, отслеживайте участников и сроки на одной странице.",
  },
  {
    icon: UsersIcon,
    title: "Предложения участников",
    description:
      "Построчные предложения по спецификации, сравнение цен и переторжка в несколько раундов.",
  },
  {
    icon: MessageCircleIcon,
    title: "Единый мессенджер",
    description:
      "Общий инбокс с уведомлениями по каждой процедуре и отдельным чатом с каждым участником.",
  },
  {
    icon: BotIcon,
    title: "ИИ-помощник",
    description: "Генерация ТЗ, разбор Excel-спецификаций, скоринг заявок и автопротокол.",
    soon: true,
  },
  {
    icon: BarChart3Icon,
    title: "Показатели компании",
    description: "Организованные процедуры, объём закупок, участия и победы — на одной панели.",
  },
  {
    icon: LayoutGridIcon,
    title: "Каталог товаров",
    description: "Витрина товаров и услуг компании для быстрого отклика на входящие запросы.",
    soon: true,
  },
];

const STEPS = [
  { title: "Создайте процедуру", description: "Заполните название, сроки и спецификацию — вручную или загрузкой Excel." },
  { title: "Участники подают предложения", description: "Каждый участник построчно отвечает на вашу спецификацию своими ценами." },
  { title: "При необходимости — переторжка", description: "Запустите новый раунд, чтобы участники могли улучшить предложение." },
  { title: "Выберите победителя", description: "Сравните предложения и завершите процедуру прямо в карточке." },
];

export default function MarketingPage() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Landmark className="size-4" />
            </div>
            ЭТП
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground sm:flex">
            <a href="#features" className="hover:text-foreground">
              Возможности
            </a>
            <a href="#how-it-works" className="hover:text-foreground">
              Как это работает
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="outline" nativeButton={false} render={<Link href="/login" />}>
              Войти
            </Button>
            <Button nativeButton={false} render={<Link href="/register" />}>
              Начать бесплатно
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 pt-20 pb-16 text-center">
          <Badge variant="secondary">Коммерческие торги, без 44-ФЗ/223-ФЗ</Badge>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Электронная торговая площадка с ИИ
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            Организатор проводит закупки и продажи, участники подают предложения, а ИИ помогает
            на всех этапах — от ТЗ до протокола.
          </p>
          <div className="flex gap-3">
            <Button size="lg" nativeButton={false} render={<Link href="/register" />}>
              Начать бесплатно
              <ArrowRightIcon />
            </Button>
            <Button size="lg" variant="outline" nativeButton={false} render={<Link href="/login" />}>
              Войти
            </Button>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-5xl px-6 pb-20">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-semibold tracking-tight">Возможности площадки</h2>
            <p className="mt-2 text-muted-foreground">Всё, что нужно для проведения торгов, в одном месте.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <Card key={feature.title} className="rounded-lg">
                <CardContent className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex size-9 items-center justify-center rounded-md bg-muted">
                      <feature.icon className="size-4.5 text-foreground" />
                    </div>
                    {feature.soon && (
                      <Badge variant="outline" className="text-muted-foreground">
                        Скоро
                      </Badge>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{feature.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="border-t bg-muted/40 py-20">
          <div className="mx-auto max-w-5xl px-6">
            <div className="mb-10 text-center">
              <h2 className="text-2xl font-semibold tracking-tight">Как это работает</h2>
              <p className="mt-2 text-muted-foreground">Жизненный цикл процедуры — от черновика до победителя.</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step, i) => (
                <div key={step.title} className="flex flex-col gap-2">
                  <div className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                    {i + 1}
                  </div>
                  <p className="font-medium">{step.title}</p>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-20">
          <div className="flex flex-col items-center gap-4 rounded-lg bg-primary px-8 py-12 text-center text-primary-foreground">
            <h2 className="text-2xl font-semibold tracking-tight">Готовы попробовать?</h2>
            <p className="max-w-md text-primary-foreground/80">
              Регистрация бесплатна — заведите компанию и опубликуйте первую процедуру за пару минут.
            </p>
            <Button size="lg" variant="secondary" nativeButton={false} render={<Link href="/register" />}>
              Начать бесплатно
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t py-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-6 text-sm text-muted-foreground sm:flex-row">
          <p>© ЭТП · Электронная торговая площадка с ИИ</p>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-foreground">
              Войти
            </Link>
            <Link href="/register" className="hover:text-foreground">
              Регистрация
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
