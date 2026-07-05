import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";

export default function AdminCustomers() {
  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-customers"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h2 className="text-title text-foreground">Customers</h2>
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-secondary/30">
              <th className="text-left p-3 text-xs font-medium text-muted-foreground">Name</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground">Phone</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground">Joined</th>
            </tr></thead>
            <tbody className="divide-y divide-border">
              {profiles.map((p: any) => (
                <tr key={p.id} className="hover:bg-secondary/20 transition-colors">
                  <td className="p-3 font-medium text-foreground">{p.full_name || "—"}</td>
                  <td className="p-3 text-muted-foreground">{p.phone || "—"}</td>
                  <td className="p-3 text-muted-foreground text-xs">{new Date(p.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {profiles.length === 0 && <tr><td colSpan={3} className="p-8 text-center text-muted-foreground">No customers yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
