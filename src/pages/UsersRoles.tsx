import { Plus, Search, MoreHorizontal, Shield, User, Radio, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUsers } from "@/hooks/use-admin-api";

const usersFallback = [
  {
    id: 1,
    name: "Admin User",
    email: "admin@grypx.com",
    role: "admin",
    status: "active",
    lastActive: "Just now",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
  },
  {
    id: 2,
    name: "Sarah Connor",
    email: "sarah@grypx.com",
    role: "scorer",
    status: "active",
    lastActive: "2 hours ago",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
  },
  {
    id: 3,
    name: "James Wilson",
    email: "james@grypx.com",
    role: "scorer",
    status: "active",
    lastActive: "5 hours ago",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=james",
  },
  {
    id: 4,
    name: "Emily Brown",
    email: "emily@grypx.com",
    role: "user",
    status: "active",
    lastActive: "1 day ago",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=emily",
  },
  {
    id: 5,
    name: "Michael Lee",
    email: "michael@grypx.com",
    role: "admin",
    status: "inactive",
    lastActive: "3 days ago",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=michael",
  },
  {
    id: 6,
    name: "Jessica Davis",
    email: "jessica@grypx.com",
    role: "user",
    status: "active",
    lastActive: "12 hours ago",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=jessica",
  },
];

const roleIcons = {
  admin: Shield,
  scorer: Radio,
  user: User,
};

export default function UsersRoles() {
  const { data: usersData, isLoading } = useUsers();
  const users = usersData || usersFallback;

  if (isLoading) {
    return (
      <DashboardLayout title="USERS & ROLES" subtitle="Manage user access and permissions">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="USERS & ROLES" subtitle="Manage user access and permissions">
      {/* Stats */}
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Users</p>
          <p className="font-display text-3xl text-foreground">{users.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Admins</p>
          <p className="font-display text-3xl text-primary">
            {users.filter((u: any) => u.role === "admin" || u.role === "ADMIN").length}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Scorers</p>
          <p className="font-display text-3xl text-accent">
            {users.filter((u: any) => u.role === "scorer" || u.role === "SCORER").length}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Active Now</p>
          <p className="font-display text-3xl text-success">
            {users.filter((u: any) => u.status === "active").length}
          </p>
        </div>
      </div>

      {/* Header Actions */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-10"
          />
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">User</TableHead>
              <TableHead className="text-muted-foreground">Role</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground">Last Active</TableHead>
              <TableHead className="text-muted-foreground text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user: any) => {
              const userRole = (user.role || '').toLowerCase();
              const RoleIcon = roleIcons[userRole as keyof typeof roleIcons] || User;
              return (
                <TableRow key={user.id} className="border-border hover:bg-secondary/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-border">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {user.name?.split(" ").map((n: string) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={userRole as "admin" | "scorer" | "user"}
                      className="gap-1"
                    >
                      <RoleIcon className="h-3 w-3" />
                      {userRole.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          user.status === "active" ? "bg-success" : "bg-muted-foreground"
                        }`}
                      />
                      <span className={user.status === "active" ? "text-success" : "text-muted-foreground"}>
                        {user.status?.charAt(0).toUpperCase() + user.status?.slice(1)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.lastActive || 'Unknown'}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Edit User</DropdownMenuItem>
                        <DropdownMenuItem>Change Role</DropdownMenuItem>
                        <DropdownMenuItem>Reset Password</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Deactivate User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Role Permissions Info */}
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h4 className="font-display text-lg text-primary">ADMIN</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            Full access to all features including user management, settings, and system configuration.
          </p>
        </div>
        <div className="rounded-xl border border-accent/30 bg-accent/5 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Radio className="h-5 w-5 text-accent" />
            <h4 className="font-display text-lg text-accent">SCORER</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            Can manage live scoring, update match events, and view match details.
          </p>
        </div>
        <div className="rounded-xl border border-secondary bg-secondary/30 p-4">
          <div className="mb-2 flex items-center gap-2">
            <User className="h-5 w-5 text-secondary-foreground" />
            <h4 className="font-display text-lg text-secondary-foreground">USER</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            View-only access to matches, teams, and player information.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
