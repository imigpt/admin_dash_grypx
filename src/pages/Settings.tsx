import { Save, Bell, Globe, Shield, Palette, Database } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Settings() {
  return (
    <DashboardLayout title="SETTINGS" subtitle="Configure your platform">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-6 bg-secondary">
          <TabsTrigger value="general" className="gap-2">
            <Globe className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2">
            <Database className="h-4 w-4" />
            Integrations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-6 font-display text-lg tracking-wide text-foreground">
              GENERAL SETTINGS
            </h3>
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="platform-name">Platform Name</Label>
                  <Input id="platform-name" defaultValue="Grypx Sports" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select defaultValue="utc">
                    <SelectTrigger id="timezone">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="utc">UTC</SelectItem>
                      <SelectItem value="est">Eastern Time (EST)</SelectItem>
                      <SelectItem value="pst">Pacific Time (PST)</SelectItem>
                      <SelectItem value="gmt">GMT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="default-sport">Default Sport</Label>
                  <Select defaultValue="football">
                    <SelectTrigger id="default-sport">
                      <SelectValue placeholder="Select sport" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="football">Football</SelectItem>
                      <SelectItem value="basketball">Basketball</SelectItem>
                      <SelectItem value="hockey">Hockey</SelectItem>
                      <SelectItem value="cricket">Cricket</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select defaultValue="en">
                    <SelectTrigger id="language">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="font-medium text-foreground">Auto-refresh Dashboard</p>
                  <p className="text-sm text-muted-foreground">
                    Automatically refresh live data every 30 seconds
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-6 font-display text-lg tracking-wide text-foreground">
              NOTIFICATION PREFERENCES
            </h3>
            <div className="space-y-4">
              {[
                { title: "Match Started", desc: "Notify when a match begins" },
                { title: "Goal Scored", desc: "Notify on every goal" },
                { title: "Match Ended", desc: "Notify when a match concludes" },
                { title: "Card Issued", desc: "Notify on yellow/red cards" },
                { title: "Tournament Updates", desc: "Important tournament announcements" },
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-border p-4"
                >
                  <div>
                    <p className="font-medium text-foreground">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch defaultChecked={index < 3} />
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="security">
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-6 font-display text-lg tracking-wide text-foreground">
              SECURITY SETTINGS
            </h3>
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="session-timeout">Session Timeout</Label>
                  <Select defaultValue="30">
                    <SelectTrigger id="session-timeout">
                      <SelectValue placeholder="Select timeout" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="font-medium text-foreground">Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="font-medium text-foreground">Login Alerts</p>
                  <p className="text-sm text-muted-foreground">
                    Get notified of new logins to your account
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="appearance">
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-6 font-display text-lg tracking-wide text-foreground">
              APPEARANCE SETTINGS
            </h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Theme</Label>
                <div className="grid grid-cols-3 gap-4">
                  <button className="flex flex-col items-center gap-2 rounded-lg border-2 border-primary bg-primary/10 p-4">
                    <div className="h-16 w-full rounded bg-background" />
                    <span className="text-sm font-medium">Dark</span>
                  </button>
                  <button className="flex flex-col items-center gap-2 rounded-lg border border-border p-4 opacity-50">
                    <div className="h-16 w-full rounded bg-foreground" />
                    <span className="text-sm font-medium">Light</span>
                  </button>
                  <button className="flex flex-col items-center gap-2 rounded-lg border border-border p-4 opacity-50">
                    <div className="h-16 w-full rounded bg-gradient-to-r from-background to-foreground" />
                    <span className="text-sm font-medium">System</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Accent Color</Label>
                <div className="flex gap-3">
                  {[
                    "hsl(145 80% 45%)",
                    "hsl(210 90% 55%)",
                    "hsl(35 95% 55%)",
                    "hsl(0 75% 55%)",
                    "hsl(280 70% 50%)",
                  ].map((color, index) => (
                    <button
                      key={index}
                      className={`h-10 w-10 rounded-full ring-2 ring-offset-2 ring-offset-background ${
                        index === 0 ? "ring-primary" : "ring-transparent"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="integrations">
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-6 font-display text-lg tracking-wide text-foreground">
              API & INTEGRATIONS
            </h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="api-endpoint">API Endpoint</Label>
                <Input
                  id="api-endpoint"
                  defaultValue="https://api.grypx.com/v1"
                  readOnly
                  className="font-mono"
                />
              </div>

              <div className="rounded-lg border border-border p-4">
                <p className="mb-2 font-medium text-foreground">Spring Boot Backend</p>
                <p className="mb-4 text-sm text-muted-foreground">
                  Connect your Spring Boot backend for real-time data sync
                </p>
                <Button variant="outline">Configure Connection</Button>
              </div>

              <div className="rounded-lg border border-border p-4">
                <p className="mb-2 font-medium text-foreground">Webhook Notifications</p>
                <p className="mb-4 text-sm text-muted-foreground">
                  Send real-time updates to external services
                </p>
                <Button variant="outline">Manage Webhooks</Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <Button size="lg">
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>
    </DashboardLayout>
  );
}
