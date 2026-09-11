import { useState, useEffect } from "react";
import { Loader2, Search, RefreshCw } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { api } from "@/lib/apiClient";
import { format } from "date-fns";

interface ApiLog {
  id: string;
  user_id: string;
  endpoint: string;
  method: string;
  status_code: number | null;
  response_time_ms: number | null;
  ip_address: string | null;
  created_at: string;
  full_name?: string;
}

export function AdminApiLogs() {
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: "200",
        status: statusFilter,
      });
      const data = await api.get(`/admin/api-logs?${params}`);
      setLogs(data.logs ?? []);
    } catch {
      toast.error("Failed to load API logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getStatusBadge = (code: number | null) => {
    if (!code) return <Badge variant="secondary">N/A</Badge>;
    if (code >= 200 && code < 300)
      return (
        <Badge className="bg-primary/10 text-primary border-primary/20">
          {code}
        </Badge>
      );
    if (code >= 400 && code < 500)
      return <Badge variant="destructive">{code}</Badge>;
    return <Badge variant="secondary">{code}</Badge>;
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      !search ||
      log.endpoint.toLowerCase().includes(search.toLowerCase()) ||
      (log.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
      log.user_id.includes(search);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "success" &&
        log.status_code != null &&
        log.status_code >= 200 &&
        log.status_code < 300) ||
      (statusFilter === "error" &&
        log.status_code != null &&
        log.status_code >= 400);

    return matchesSearch && matchesStatus;
  });

  // Stats
  const totalRequests = logs.length;
  const successCount = logs.filter(
    (l) => l.status_code != null && l.status_code >= 200 && l.status_code < 300,
  ).length;
  const errorCount = logs.filter(
    (l) => l.status_code != null && l.status_code >= 400,
  ).length;
  const avgResponseTime =
    logs.length > 0
      ? Math.round(
          logs.reduce((sum, l) => sum + (l.response_time_ms || 0), 0) /
            logs.length,
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Total Requests</p>
            <p className="text-2xl font-bold text-foreground">
              {totalRequests}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Successful</p>
            <p className="text-2xl font-bold text-primary">{successCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Errors</p>
            <p className="text-2xl font-bold text-destructive">{errorCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Avg Response</p>
            <p className="text-2xl font-bold text-foreground">
              {avgResponseTime}ms
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Logs Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <CardTitle>API Request Logs</CardTitle>
              <CardDescription>Monitor reseller API activity</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchLogs}
              className="gap-2"
            >
              <RefreshCw className="w-3 h-3" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by endpoint or user..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="error">Errors</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <p className="text-center text-muted-foreground py-12 text-sm">
              No API logs found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Response</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(log.created_at), "MMM d, HH:mm:ss")}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {log.full_name || log.user_id.slice(0, 8)}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.endpoint}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {log.method}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(log.status_code)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {log.response_time_ms
                          ? `${log.response_time_ms}ms`
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
