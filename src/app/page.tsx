
"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DragonIcon } from "@/components/icons";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { register, login } from "@/services/authService";
import { Loader2 } from "lucide-react";

export default function AuthenticationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAuthError = (error: any) => {
    let title = "Ошибка аутентификации";
    let description = "Произошла неизвестная ошибка.";

    console.error("Auth Error:", error);

    if (error.message) {
      description = error.message;
    }
    
    toast({
      variant: "destructive",
      title: title,
      description: description,
    });
  }

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        toast({ title: "Вход выполнен", description: "Добро пожаловать обратно, странник!" });
        router.push("/dashboard");
      } else {
        toast({
          variant: "destructive",
          title: "Ошибка входа",
          description: result.error || "Не удалось войти в систему",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Ошибка входа",
        description: error.message || "Произошла неизвестная ошибка",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Пароли не совпадают",
        description: "Пожалуйста, убедитесь, что вы ввели одинаковые пароли.",
      });
      return;
    }
    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Слишком короткий пароль",
        description: "Пароль должен содержать не менее 6 символов.",
      });
      return;
    }
    setIsLoading(true);
    try {
      const result = await register(email, password);
      if (result.success) {
        toast({ title: "Регистрация успешна", description: "Теперь создайте своего героя." });
        router.push("/create-character");
      } else {
        toast({
          variant: "destructive",
          title: "Ошибка регистрации",
          description: result.error || "Не удалось зарегистрироваться",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Ошибка регистрации",
        description: error.message || "Произошла неизвестная ошибка",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-screen lg:grid lg:grid-cols-2">
      <div className="hidden bg-background lg:block relative">
        <Image
          src="/images/login/login-bg2.jpg"
          alt="Image of a fantasy landscape"
          data-ai-hint="fantasy landscape"
          width="1200"
          height="1200"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        <div className="absolute top-8 left-8 z-10">
          <Link
            href="#"
            className="flex items-center gap-2 text-primary-foreground text-xl font-semibold font-headline"
          >
            <DragonIcon className="h-7 w-7 text-primary" />
            ElderScrollsIdle
          </Link>
        </div>
         <div className="absolute bottom-8 left-8 z-10">
          <blockquote className="space-y-2">
            <p className="text-lg text-stone-200 font-body drop-shadow-md">
              “Единственная настоящая сила идет изнутри.”
            </p>
            <footer className="text-sm text-muted-foreground font-body">Старая орочья пословица</footer>
          </blockquote>
        </div>
      </div>
      <div className="flex items-center justify-center py-12 px-4 h-full">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold font-headline">Добро пожаловать, странник</h1>
            <p className="text-balance text-muted-foreground font-body">
              Ваша эпическая история начинается здесь. Войдите или создайте своего героя.
            </p>
          </div>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Вход</TabsTrigger>
              <TabsTrigger value="register">Регистрация</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <form onSubmit={handleLogin}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Электронная почта</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="miraak@solstheim.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center">
                      <Label htmlFor="password">Пароль</Label>
                    </div>
                    <Input 
                      id="password" 
                      type="password" 
                      required 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <Button type="submit" className="w-full font-bold" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Войти
                  </Button>
                </div>
              </form>
            </TabsContent>
            <TabsContent value="register">
              <form onSubmit={handleRegister}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="reg-email">Электронная почта</Label>
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="nerevar@morrowind.net"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="reg-password">Пароль</Label>
                    <Input 
                      id="reg-password" 
                      type="password" 
                      required 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                   <div className="grid gap-2">
                    <Label htmlFor="confirm-password">Подтвердите пароль</Label>
                    <Input 
                      id="confirm-password" 
                      type="password" 
                      required 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <Button type="submit" className="w-full font-bold" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Создать аккаунт и героя
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
