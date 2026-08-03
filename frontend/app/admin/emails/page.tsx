"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Mail, 
  Save, 
  Code, 
  Eye, 
  Send, 
  RefreshCw,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import api from "@/lib/api/client";

export default function EmailManagementPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [testEmail, setTestEmail] = useState("");

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/emails");
      const data = res.data?.data || res.data;
      setTemplates(data || []);
      if (data && data.length > 0 && !selectedTemplateId) {
        setSelectedTemplateId(data[0].id);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  // Derive current template
  const currentTemplate = templates.find(t => t.id === selectedTemplateId) || templates[0] || null;

  const [formData, setFormData] = useState({
    subject: "",
    body: ""
  });

  useEffect(() => {
    if (currentTemplate) {
      setFormData({
        subject: currentTemplate.subject || "",
        body: currentTemplate.body || ""
      });
      setViewMode("edit");
    }
  }, [currentTemplate?.id]);

  const handleSelectTemplate = (id: number) => {
    setSelectedTemplateId(id);
  };

  const handleSave = async () => {
    if (!currentTemplate) return;
    setSaving(true);
    try {
      await api.patch(`/admin/emails/${currentTemplate.id}`, formData);
      toast.success("Template saved successfully");
      fetchTemplates();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!currentTemplate) return;
    try {
      await api.post(`/admin/emails/test`, {
        ...formData,
        variables: currentTemplate.variables,
        testEmail: testEmail || undefined,
      });
      toast.success("Test email sent to your inbox");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to send test email");
    }
  };

  return (
    <div className="h-full flex flex-col p-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Mail className="w-6 h-6 text-primary" />
            Email Templates
          </h1>
          <p className="text-sm font-medium text-muted-foreground mt-0.5">
            Manage and customize the automated emails sent by the platform.
          </p>
        </div>
        <Button className="rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-10 px-4 shadow-sm text-sm">
          Create Custom Template
        </Button>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Sidebar - Template List */}
        <div className="w-80 shrink-0 flex flex-col gap-4">
          <div className="relative shrink-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 rounded-xl bg-background border-border focus:bg-background shadow-sm"
            />
          </div>

          <div className="bg-background rounded-xl border border-border shadow-sm flex flex-col flex-1 overflow-hidden">
            <div className="p-4 border-b border-border font-bold text-foreground flex justify-between items-center shrink-0">
              <span className="text-sm">System Templates</span>
              <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/10 rounded-md px-1.5 py-0">
                {templates.length}
              </Badge>
            </div>
            {loading ? (
              <div className="flex justify-center items-center flex-1 text-muted-foreground">
                <RefreshCw className="w-5 h-5 animate-spin" />
              </div>
            ) : templates.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 p-6 text-center">
                <p className="text-sm text-muted-foreground mb-4">No templates found.</p>
                <Button onClick={async () => {
                  await api.post("/admin/emails/seed");
                  fetchTemplates();
                }}>Seed Default Templates</Button>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                {templates
                  .filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(t => (
                    <button
                      key={t.id}
                      onClick={() => handleSelectTemplate(t.id)}
                      className={`w-full flex items-start flex-col gap-1 p-3 rounded-lg border text-left transition-all duration-200 ${
                        selectedTemplateId === t.id
                          ? "bg-primary/5 border-primary shadow-sm"
                          : "bg-background border-border/50 hover:border-primary/40 hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className={`font-semibold text-sm ${selectedTemplateId === t.id ? "text-primary" : "text-foreground"}`}>
                          {t.name}
                        </span>
                        <div className={`w-2 h-2 rounded-full shrink-0 ${t.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      </div>
                      <span className="text-xs text-muted-foreground line-clamp-1">{t.description}</span>
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content - Editor */}
        <div className="flex-1 flex flex-col min-w-0">
          {currentTemplate ? (
            <motion.div
              key={currentTemplate.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-background rounded-xl border border-border shadow-sm flex flex-col flex-1 overflow-hidden"
            >
              <div className="p-5 border-b border-border flex justify-between items-center shrink-0">
                <div>
                  <h2 className="text-lg font-bold text-foreground">{currentTemplate.name}</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">{currentTemplate.description}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant={viewMode === 'edit' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('edit')} className="rounded-lg h-9">
                    <Code className="w-4 h-4 mr-2" /> Edit
                  </Button>
                  <Button variant={viewMode === 'preview' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('preview')} className="rounded-lg h-9">
                    <Eye className="w-4 h-4 mr-2" /> Preview
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                {viewMode === "edit" ? (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Subject</Label>
                      <Input 
                        value={formData.subject} 
                        onChange={(e) => setFormData(prev => ({...prev, subject: e.target.value}))}
                        className="h-11 rounded-lg border-border bg-background focus:ring-1 focus:ring-primary shadow-sm" 
                      />
                    </div>
                    <div className="space-y-2 flex-1 flex flex-col">
                      <div className="flex justify-between items-center">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">HTML Body</Label>
                        <div className="flex gap-2 text-xs items-center">
                          <span className="text-muted-foreground">Variables:</span>
                          <div className="flex gap-1 flex-wrap">
                            {(currentTemplate.variables || []).map((v: string) => (
                              <Badge key={v} variant="outline" className="text-[10px] bg-muted/50 text-foreground border-border/50">{`{{${v}}}`}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <Textarea 
                        value={formData.body}
                        onChange={(e) => setFormData(prev => ({...prev, body: e.target.value}))}
                        className="flex-1 min-h-[300px] rounded-lg border-border bg-background focus:ring-1 focus:ring-primary font-mono text-sm shadow-sm p-4" 
                      />
                    </div>
                  </>
                ) : (
                    <div className="border border-border rounded-xl p-8 bg-background shadow-sm min-h-[400px]">
                      <div className="border-b border-border/50 pb-4 mb-4">
                        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Subject:</p>
                        <p className="text-lg font-bold text-foreground">{formData.subject}</p>
                      </div>
                      <div 
                        className="prose prose-sm max-w-none prose-slate dark:prose-invert"
                        dangerouslySetInnerHTML={{ __html: formData.body.replace(/{{.*?}}/g, '<span class="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 px-1 rounded">$&</span>') }}
                      />
                    </div>
                  )}
              </div>

              {/* Editor Footer */}
              <div className="p-4 border-t border-border bg-muted/20 flex justify-between items-center shrink-0 rounded-b-xl">
                <div className="flex gap-2 items-center">
                  <Input 
                    placeholder="Test email address"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="h-10 rounded-lg border-border bg-background w-48 shadow-sm"
                  />
                  <Button variant="outline" onClick={handleTestEmail} className="rounded-lg border-border font-bold text-foreground bg-background hover:bg-muted h-10 px-4 shadow-sm text-sm">
                    <Send className="w-4 h-4 mr-2" /> Send Test Email
                  </Button>
                </div>
                <Button onClick={handleSave} disabled={saving} className="rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-10 px-6 shadow-sm text-sm">
                  {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Changes
                </Button>
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-center text-muted-foreground bg-background rounded-xl border border-border shadow-sm">
              <Mail className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm font-medium">Select a template to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
