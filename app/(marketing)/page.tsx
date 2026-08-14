import Link from "next/link";
import Image from "next/image";
import {
  Landmark,
  ShoppingCartIcon,
  UsersIcon,
  MessageCircleIcon,
  CpuIcon,
  BarChart3Icon,
  LayoutGridIcon,
  ArrowRightIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

// Своя цветовая тема для лендинга (акцентный синий, цветные плашки под
// иконки) — только классы на этой странице, глобальные токены темы
// (globals.css) не трогаем, чтобы яркость не утекла в продуктовый UI.
const FEATURES = [
  {
    icon: ShoppingCartIcon,
    title: "Закупки и продажи",
    description:
      "Публикуйте процедуры, ведите статус от черновика до завершения, отслеживайте участников и сроки на одной странице.",
    chip: "bg-sky-100 text-sky-600",
  },
  {
    icon: UsersIcon,
    title: "Предложения участников",
    description:
      "Построчные предложения по спецификации, сравнение цен и переторжка в несколько раундов.",
    chip: "bg-pink-100 text-pink-600",
  },
  {
    icon: MessageCircleIcon,
    title: "Единый мессенджер",
    description:
      "Общий инбокс с уведомлениями по каждой процедуре и отдельным чатом с каждым участником.",
    chip: "bg-slate-100 text-slate-600",
  },
  {
    icon: CpuIcon,
    title: "ИИ-помощник",
    description: "Генерация ТЗ, разбор Excel-спецификаций, скоринг заявок и автопротокол.",
    chip: "bg-violet-100 text-violet-600",
    soon: true,
  },
  {
    icon: BarChart3Icon,
    title: "Показатели компании",
    description: "Организованные процедуры, объём закупок, участия и победы — на одной панели.",
    chip: "bg-amber-100 text-amber-600",
  },
  {
    icon: LayoutGridIcon,
    title: "Каталог товаров",
    description: "Витрина товаров и услуг компании для быстрого отклика на входящие запросы.",
    chip: "bg-emerald-100 text-emerald-600",
    soon: true,
  },
];

const STEPS = [
  { title: "Создайте процедуру", description: "Заполните название, сроки и спецификацию — вручную или загрузкой Excel." },
  { title: "Участники подают предложения", description: "Каждый участник построчно отвечает на вашу спецификацию своими ценами." },
  { title: "При необходимости — переторжка", description: "Запустите новый раунд, чтобы участники могли улучшить предложение." },
  { title: "Выберите победителя", description: "Сравните предложения и завершите процедуру прямо в карточке." },
];

const primaryPill = "rounded-full bg-blue-600 text-white hover:bg-blue-700";
const outlinePill = "rounded-full border-blue-100 bg-white/70 hover:bg-white";

// Отсылка к приёму Bitrix24: разбросанные вокруг заголовка портреты людей
// с маленькой цветной иконкой-бейджем поверх. Фото — сгенерированные ИИ
// (не реальные люди), пользователь прислал их и попросил заменить
// иконки-силуэты. Видно только на широких экранах, чтобы не мешать тексту.
const PEOPLE = [
  { position: "left-0 top-2", rotate: "-rotate-6", photo: "/landing/person-4.jpg", badge: ShoppingCartIcon, badgeBg: "bg-sky-500" },
  { position: "right-0 top-10", rotate: "rotate-6", photo: "/landing/person-1.jpg", badge: MessageCircleIcon, badgeBg: "bg-slate-800" },
  { position: "left-6 bottom-0", rotate: "rotate-3", photo: "/landing/person-2.jpg", badge: UsersIcon, badgeBg: "bg-pink-500" },
  { position: "right-6 bottom-4", rotate: "-rotate-3", photo: "/landing/person-3.jpg", badge: CpuIcon, badgeBg: "bg-violet-600" },
];

export default function MarketingPage() {
  return (
    <div className="flex min-h-svh flex-col bg-gradient-to-b from-blue-50 via-indigo-50/50 to-white">
      <header className="sticky top-0 z-10 bg-gradient-to-b from-blue-50/90 to-blue-50/40 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <div className="flex size-7 items-center justify-center rounded-xl bg-foreground text-background">
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
            <Button variant="outline" className={outlinePill} nativeButton={false} render={<Link href="/login" />}>
              Войти
            </Button>
            <Button className={primaryPill} nativeButton={false} render={<Link href="/register" />}>
              Начать бесплатно
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative mx-auto max-w-6xl px-6 pt-20 pb-24">
          {PEOPLE.map((p) => (
            <div key={p.position} className={`absolute hidden size-24 lg:block ${p.position} ${p.rotate}`}>
              <div className="relative size-24 overflow-hidden rounded-[36px] shadow-lg">
                <Image src={p.photo} alt="" fill sizes="96px" className="object-cover" />
              </div>
              <div
                className={`absolute -right-3 -bottom-3 flex size-10 items-center justify-center rounded-full text-white shadow-md ring-2 ring-white ${p.badgeBg}`}
              >
                <p.badge className="size-5" />
              </div>
            </div>
          ))}
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
            <Badge className="rounded-full border-blue-100 bg-white/70 text-blue-700" variant="outline">
              Коммерческие торги, без 44-ФЗ/223-ФЗ
            </Badge>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Электронная торговая площадка <span className="text-blue-600">с ИИ</span>
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              Организатор проводит закупки и продажи, участники подают предложения, а ИИ помогает
              на всех этапах — от ТЗ до протокола.
            </p>
            <div className="flex gap-3">
              <Button size="lg" className={primaryPill} nativeButton={false} render={<Link href="/register" />}>
                Начать бесплатно
                <ArrowRightIcon />
              </Button>
              <Button size="lg" variant="outline" className={outlinePill} nativeButton={false} render={<Link href="/login" />}>
                Войти
              </Button>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-5xl px-6 pb-20">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-semibold tracking-tight">Возможности площадки</h2>
            <p className="mt-2 text-muted-foreground">Всё, что нужно для проведения торгов, в одном месте.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <Card key={feature.title} className="rounded-2xl border-transparent bg-white/80 shadow-sm">
                <CardContent className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className={`flex size-10 items-center justify-center rounded-xl ${feature.chip}`}>
                      <feature.icon className="size-5" />
                    </div>
                    {feature.soon && (
                      <Badge variant="secondary" className="rounded-full text-muted-foreground">
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

        <section id="how-it-works" className="py-20">
          <div className="mx-auto max-w-5xl px-6">
            <div className="mb-10 text-center">
              <h2 className="text-2xl font-semibold tracking-tight">Как это работает</h2>
              <p className="mt-2 text-muted-foreground">Жизненный цикл процедуры — от черновика до победителя.</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step, i) => (
                <div key={step.title} className="flex flex-col gap-2">
                  <div className="flex size-8 items-center justify-center rounded-full bg-blue-600 text-sm font-medium text-white">
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
          <div className="flex flex-col items-center gap-4 rounded-3xl bg-gradient-to-br from-blue-100 via-indigo-50 to-blue-50 px-8 py-14 text-center">
            <h2 className="text-2xl font-semibold tracking-tight">Готовы попробовать?</h2>
            <p className="max-w-md text-muted-foreground">
              Регистрация бесплатна — заведите компанию и опубликуйте первую процедуру за пару минут.
            </p>
            <Button size="lg" className={primaryPill} nativeButton={false} render={<Link href="/register" />}>
              Начать бесплатно
              <ArrowRightIcon />
            </Button>
          </div>
        </section>
      </main>

      <footer className="py-6">
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
