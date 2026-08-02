export default function CheckEmailPage() {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <h1 className="text-2xl font-bold">Подтвердите email</h1>
      <p className="text-sm text-balance text-muted-foreground">
        Мы отправили письмо со ссылкой для подтверждения аккаунта. Перейдите
        по ссылке из письма, чтобы завершить регистрацию.
      </p>
    </div>
  );
}
