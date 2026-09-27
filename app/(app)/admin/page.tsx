import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { InviteForm } from "./_components/invite-form";
import { RoleToggle } from "./_components/role-toggle";
import type { Profile } from "@/lib/types";

export default async function AdminPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true })
    .returns<Profile[]>();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-xl font-semibold">Admin Paneli</h1>
        <p className="text-sm text-muted-foreground">
          Kullanıcı davet et ve rolleri yönet.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Yeni Kullanıcı Davet Et</CardTitle>
        </CardHeader>
        <CardContent>
          <InviteForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Kullanıcılar</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>E-posta</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Katılma</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles?.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell>{profile.email}</TableCell>
                  <TableCell>
                    <Badge variant={profile.role === "admin" ? "default" : "secondary"}>
                      {profile.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(profile.created_at).toLocaleDateString("tr-TR")}
                  </TableCell>
                  <TableCell>
                    <RoleToggle
                      userId={profile.id}
                      role={profile.role}
                      disabled={profile.id === admin.id}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
