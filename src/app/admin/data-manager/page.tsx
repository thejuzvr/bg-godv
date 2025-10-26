"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Trash2, Search, RefreshCw, Users, Swords } from "lucide-react";
import { 
  fetchAllUsers,
  fetchAllCharacters, 
  deleteCharacter,
  deleteUser,
  type AdminUserView,
  type AdminCharacterView 
} from "./actions";

export default function DataManagerPage() {
  const { user, loading } = useAuth(true);
  const { toast } = useToast();

  const [users, setUsers] = useState<AdminUserView[]>([]);
  const [characters, setCharacters] = useState<AdminCharacterView[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingCharacters, setIsLoadingCharacters] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [userSearch, setUserSearch] = useState("");
  const [characterSearch, setCharacterSearch] = useState("");

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const result = await fetchAllUsers();
      if (result.success && result.users) {
        setUsers(result.users);
      } else {
        toast({ 
          title: "Ошибка", 
          description: result.error || "Не удалось загрузить пользователей", 
          variant: "destructive" 
        });
      }
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const loadCharacters = async () => {
    setIsLoadingCharacters(true);
    try {
      const result = await fetchAllCharacters();
      if (result.success && result.characters) {
        setCharacters(result.characters);
      } else {
        toast({ 
          title: "Ошибка", 
          description: result.error || "Не удалось загрузить героев", 
          variant: "destructive" 
        });
      }
    } finally {
      setIsLoadingCharacters(false);
    }
  };

  useEffect(() => {
    if (!loading && user?.isAdmin) {
      loadUsers();
      loadCharacters();
    }
  }, [loading, user]);

  const handleDeleteUser = async (userId: string, email: string) => {
    setIsDeleting(true);
    const result = await deleteUser(userId);
    if (result.success) {
      toast({ title: "Пользователь удалён", description: `${email} был успешно удалён.` });
      await loadUsers();
      await loadCharacters(); // Обновляем героев тоже
    } else {
      toast({ 
        title: "Ошибка удаления", 
        description: result.error || "Не удалось удалить пользователя.", 
        variant: "destructive" 
      });
    }
    setIsDeleting(false);
  };

  const handleDeleteCharacter = async (characterId: string, characterName: string) => {
    setIsDeleting(true);
    const result = await deleteCharacter(characterId);
    if (result.success) {
      toast({ title: "Герой удалён", description: `${characterName} был успешно удалён.` });
      await loadCharacters();
    } else {
      toast({ 
        title: "Ошибка удаления", 
        description: result.error || "Не удалось удалить героя.", 
        variant: "destructive" 
      });
    }
    setIsDeleting(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen font-headline text-xl">Загрузка...</div>;
  }

  if (!user || !user.isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Доступ запрещён</CardTitle>
            <CardDescription>У вас нет прав для доступа к этой странице.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/dashboard">Вернуться на дашборд</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredCharacters = characters.filter(c =>
    c.name.toLowerCase().includes(characterSearch.toLowerCase())
  );

  return (
    <div className="w-full font-body p-4 md:p-8 space-y-8">
      <header>
        <h1 className="text-4xl font-headline text-primary">Data Manager</h1>
        <p className="text-lg text-muted-foreground mt-2">Управление пользователями и героями</p>
      </header>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Пользователи
          </TabsTrigger>
          <TabsTrigger value="characters" className="flex items-center gap-2">
            <Swords className="h-4 w-4" />
            Герои
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Пользователи ({filteredUsers.length})</CardTitle>
                  <CardDescription>Все зарегистрированные пользователи</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadUsers}
                  disabled={isLoadingUsers}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingUsers ? 'animate-spin' : ''}`} />
                  Обновить
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Поиск по email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              {isLoadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <p className="text-muted-foreground py-4">Пользователей не найдено.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Админ</TableHead>
                      <TableHead>Последний вход</TableHead>
                      <TableHead>Создан</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.email}</TableCell>
                        <TableCell>{u.isAdmin ? '✅ Да' : '—'}</TableCell>
                        <TableCell>
                          {u.lastLogin ? new Date(u.lastLogin).toLocaleString('ru-RU') : '—'}
                        </TableCell>
                        <TableCell>
                          {new Date(u.createdAt).toLocaleDateString('ru-RU')}
                        </TableCell>
                        <TableCell className="text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="destructive" 
                                size="sm" 
                                disabled={isDeleting || u.isAdmin}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Удалить
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Это действие нельзя отменить. Пользователь <strong>{u.email}</strong> и все его данные будут безвозвратно удалены.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Отмена</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteUser(u.id, u.email)}>
                                  Удалить
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Characters Tab */}
        <TabsContent value="characters" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Герои ({filteredCharacters.length})</CardTitle>
                  <CardDescription>Все созданные персонажи</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadCharacters}
                  disabled={isLoadingCharacters}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingCharacters ? 'animate-spin' : ''}`} />
                  Обновить
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Поиск по имени героя..."
                    value={characterSearch}
                    onChange={(e) => setCharacterSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              {isLoadingCharacters ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : filteredCharacters.length === 0 ? (
                <p className="text-muted-foreground py-4">Героев не найдено.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Имя</TableHead>
                      <TableHead>Уровень</TableHead>
                      <TableHead>Раса</TableHead>
                      <TableHead>Последнее обновление</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCharacters.map((char) => (
                      <TableRow key={char.id}>
                        <TableCell className="font-medium">{char.name}</TableCell>
                        <TableCell>{char.level}</TableCell>
                        <TableCell>{char.race}</TableCell>
                        <TableCell>
                          {new Date(char.lastUpdatedAt).toLocaleString('ru-RU')}
                        </TableCell>
                        <TableCell className="text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm" disabled={isDeleting}>
                                <Trash2 className="h-4 w-4 mr-1" />
                                Удалить
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Это действие нельзя отменить. Герой <strong>{char.name}</strong> и вся его летопись будут безвозвратно удалены.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Отмена</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteCharacter(char.id, char.name)}>
                                  Удалить
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
