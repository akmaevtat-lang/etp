import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { signUp } from "@/app/(auth)/actions";

export function RegisterForm({
  className,
  error,
  ...props
}: React.ComponentProps<"form"> & { error?: string }) {
  return (
    <form action={signUp} className={cn("flex flex-col gap-6", className)} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Регистрация</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Создайте аккаунт, чтобы начать работу с ЭТП
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="name">Имя</FieldLabel>
          <Input id="name" name="name" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" name="email" type="email" placeholder="m@example.com" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Пароль</FieldLabel>
          <Input id="password" name="password" type="password" required minLength={6} />
        </Field>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Field>
          <Button type="submit">Создать аккаунт</Button>
        </Field>
        <FieldDescription className="text-center">
          Уже есть аккаунт? <a href="/login" className="underline underline-offset-4">Войти</a>
        </FieldDescription>
      </FieldGroup>
    </form>
  );
}
