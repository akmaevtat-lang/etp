import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { signIn } from "@/app/(auth)/actions";

export function LoginForm({
  className,
  error,
  ...props
}: React.ComponentProps<"form"> & { error?: string }) {
  return (
    <form action={signIn} className={cn("flex flex-col gap-6", className)} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Вход</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Войдите в свой аккаунт ЭТП
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" name="email" type="email" placeholder="m@example.com" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Пароль</FieldLabel>
          <Input id="password" name="password" type="password" required />
        </Field>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Field>
          <Button type="submit">Войти</Button>
        </Field>
        <FieldDescription className="text-center">
          Нет аккаунта? <a href="/register" className="underline underline-offset-4">Зарегистрироваться</a>
        </FieldDescription>
      </FieldGroup>
    </form>
  );
}
