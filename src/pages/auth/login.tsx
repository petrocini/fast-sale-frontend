import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, Loader2, Store } from "lucide-react";

import { api } from "@/api/axios";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const loginSchema = z.object({
  email: z.string().email("Digite um e-mail válido"),
  password: z.string().min(1, "A senha é obrigatória"),
});

type LoginForm = z.infer<typeof loginSchema>;

export function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  async function handleLogin(data: LoginForm) {
    setError(null);
    try {
      const response = await api.post("/login", data);

      const { token, user } = response.data;

      localStorage.setItem("@fastsale:token", token);
      localStorage.setItem("@fastsale:user", JSON.stringify(user));

      navigate("/");
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError("E-mail ou senha incorretos.");
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Erro ao conectar com o servidor. Tente novamente.");
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border bg-card shadow-xl">
        <CardHeader className="space-y-1 flex flex-col items-center text-center">
          <div className="bg-primary/10 p-3 rounded-full mb-2">
            <Store className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Fast Sale
          </CardTitle>
          <CardDescription>
            Entre com suas credenciais para acessar o PDV
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleLogin)} className="space-y-4">
            {error && (
              <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                placeholder="nome@exemplo.com"
                type="email"
                {...register("email")}
                className={
                  errors.email
                    ? "border-destructive focus-visible:ring-destructive"
                    : ""
                }
              />
              {errors.email && (
                <span className="text-xs text-destructive">
                  {errors.email.message}
                </span>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
              </div>
              <Input
                id="password"
                type="password"
                {...register("password")}
                className={
                  errors.password
                    ? "border-destructive focus-visible:ring-destructive"
                    : ""
                }
              />
              {errors.password && (
                <span className="text-xs text-destructive">
                  {errors.password.message}
                </span>
              )}
            </div>

            <Button
              type="submit"
              className="w-full font-bold"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Acessar Sistema"
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground mt-4">
              Não tem conta?{" "}
              <Link
                to="/register"
                className="text-primary hover:underline font-medium"
              >
                Solicitar Acesso
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
