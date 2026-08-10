import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/lib/hooks/use-toast";
import api from "@/lib/api/client";

interface EditCompanyModalProps {
  open: boolean;
  onClose: () => void;
  company: any;
  onSuccess: () => void;
}

export function EditCompanyModal({ open, onClose, company, onSuccess }: EditCompanyModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    googleMapUrl: "",
    logoUrl: "",
    description: "",
    services: [] as any[]
  });

  const [tempService, setTempService] = useState({
    name: "", typeId: "", basePrice: "", durationMin: "60", image: ""
  });

  useEffect(() => {
    if (open) {
      api.get('/service-types').then(res => {
        const payload = res.data.data || res.data;
        setServiceTypes(Array.isArray(payload) ? payload : payload.data || []);
      }).catch(() => {});
    }
  }, [open]);

  useEffect(() => {
    if (open && company) {
      setFormData({
        name: company.name || "",
        email: company.email || "",
        phone: company.phone || "",
        address: company.address || "",
        city: company.city || "",
        googleMapUrl: company.googleMapUrl || "",
        logoUrl: company.logoUrl || "",
        description: company.description || "",
        services: (company.services || []).map((s: any) => ({
          id: s.id.toString(),
          name: s.name,
          typeId: s.typeId,
          basePrice: s.basePrice,
          durationMin: s.durationMin,
          image: s.image || ""
        }))
      });
      setActiveTab("general");
    }
  }, [open, company]);

  const handleAddService = () => {
    if (!tempService.name || !tempService.typeId) {
      toast({ title: "Error", description: "Service Name and Category are required.", variant: "destructive" });
      return;
    }
    setFormData({
      ...formData,
      services: [...formData.services, {
        name: tempService.name,
        typeId: Number(tempService.typeId),
        basePrice: tempService.basePrice ? Number(tempService.basePrice) : undefined,
        durationMin: tempService.durationMin ? Number(tempService.durationMin) : undefined,
        image: tempService.image || undefined,
      }]
    });
    setTempService({ name: "", typeId: "", basePrice: "", durationMin: "60", image: "" });
  };

  const handleRemoveService = (index: number) => {
    const newServices = [...formData.services];
    newServices.splice(index, 1);
    setFormData({ ...formData, services: newServices });
  };

  const updateServiceField = (index: number, field: string, value: any) => {
    const newServices = [...formData.services];
    newServices[index] = { ...newServices[index], [field]: value };
    setFormData({ ...formData, services: newServices });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        ...formData,
        services: formData.services.map(s => ({
          ...s,
          typeId: s.typeId ? parseInt(s.typeId, 10) : 1, // Fallback to 1 if empty to pass validation
          basePrice: s.basePrice ? Number(s.basePrice) : undefined,
          durationMin: s.durationMin ? Number(s.durationMin) : undefined
        }))
      };
      await api.patch(`/admin/companies/${company.id}`, payload);
      toast({ title: "Success", description: "Company updated successfully." });
      onSuccess();
      onClose();
    } catch (err: any) {
      toast({ title: "Error", description: err.response?.data?.message || "Failed to update company", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!company) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl bg-background border-border shadow-xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b border-border shrink-0">
          <DialogTitle className="text-lg font-black text-foreground">Edit Company Details</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 border-b border-border">
            <TabsList className="bg-transparent h-12 p-0 w-full justify-start gap-6">
              <TabsTrigger 
                value="general" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-violet-600 data-[state=active]:text-foreground text-muted-foreground font-bold tracking-wide uppercase text-[11px] rounded-none px-0 h-12"
              >
                General Info
              </TabsTrigger>
              <TabsTrigger 
                value="services" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-violet-600 data-[state=active]:text-foreground text-muted-foreground font-bold tracking-wide uppercase text-[11px] rounded-none px-0 h-12"
              >
                Services Menu
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <TabsContent value="general" className="m-0 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase">Company Name</Label>
                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="h-9 font-medium" />
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase">Logo URL</Label>
                <Input value={formData.logoUrl} onChange={e => setFormData({ ...formData, logoUrl: e.target.value })} placeholder="https://example.com/logo.png" className="h-9 font-medium" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase">Email</Label>
                  <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="h-9 font-medium" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase">Phone</Label>
                  <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="h-9 font-medium" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase">Address</Label>
                  <Input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="h-9 font-medium" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase">City</Label>
                  <Input value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} className="h-9 font-medium" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase">Google Maps Link</Label>
                <Input value={formData.googleMapUrl} onChange={e => setFormData({ ...formData, googleMapUrl: e.target.value })} placeholder="Paste Google Maps URL here..." className="h-9 font-medium" />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase">Description</Label>
                <Textarea 
                  value={formData.description} 
                  onChange={e => setFormData({ ...formData, description: e.target.value })} 
                  className="resize-none h-20 font-medium" 
                />
              </div>
            </TabsContent>

            <TabsContent value="services" className="m-0 space-y-4">
              <p className="text-xs text-muted-foreground mb-4">Manage the services this company provides. You can edit existing service names and prices, or add new ones.</p>
              
              {formData.services.length > 0 ? (
                <div className="space-y-3">
                  {formData.services.map((svc, i) => (
                    <div key={i} className="flex flex-col gap-2 p-3 bg-muted/20 border border-border rounded-lg relative pr-10">
                      <div className="grid grid-cols-2 gap-2">
                        <Input 
                          value={svc.name} 
                          onChange={e => updateServiceField(i, 'name', e.target.value)} 
                          placeholder="Service Name" 
                          className="h-8 text-sm"
                        />
                        <Select value={svc.typeId?.toString()} onValueChange={v => updateServiceField(i, 'typeId', v)}>
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Category" />
                          </SelectTrigger>
                          <SelectContent>
                            {serviceTypes.map(t => (
                              <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                          <Input 
                            type="number" 
                            value={svc.basePrice || ""} 
                            onChange={e => updateServiceField(i, 'basePrice', e.target.value)} 
                            placeholder="Price" 
                            className="h-8 pl-6 text-sm"
                          />
                        </div>
                        <div className="relative">
                          <Input 
                            type="number" 
                            value={svc.durationMin || ""} 
                            onChange={e => updateServiceField(i, 'durationMin', e.target.value)} 
                            placeholder="Mins" 
                            className="h-8 pr-10 text-sm"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">min</span>
                        </div>
                        <Input 
                          value={svc.image || ""} 
                          onChange={e => updateServiceField(i, 'image', e.target.value)} 
                          placeholder="Image URL" 
                          className="h-8 text-sm"
                        />
                      </div>
                      
                      <button 
                        type="button" 
                        onClick={() => handleRemoveService(i)} 
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 rounded-md transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center border border-dashed border-border rounded-xl">
                  <p className="text-sm text-muted-foreground">No services added yet.</p>
                </div>
              )}

              <div className="p-4 bg-muted/10 border border-border/50 rounded-xl space-y-3 mt-4">
                <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Add New Service</h5>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Service Name (e.g. Deep Cleaning)" value={tempService.name} onChange={e => setTempService({...tempService, name: e.target.value})} className="h-8 text-sm" />
                  <Select value={tempService.typeId} onValueChange={v => setTempService({...tempService, typeId: v})}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select Category" /></SelectTrigger>
                    <SelectContent>
                      {serviceTypes.map(t => (
                        <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                    <Input type="number" placeholder="Base Price" value={tempService.basePrice} onChange={e => setTempService({...tempService, basePrice: e.target.value})} className="h-8 pl-6 text-sm" />
                  </div>
                  <div className="relative">
                    <Input type="number" placeholder="Duration" value={tempService.durationMin} onChange={e => setTempService({...tempService, durationMin: e.target.value})} className="h-8 pr-10 text-sm" />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">min</span>
                  </div>
                  <Input placeholder="Image URL" value={tempService.image} onChange={e => setTempService({...tempService, image: e.target.value})} className="h-8 text-sm" />
                </div>
                <Button type="button" variant="outline" size="sm" onClick={handleAddService} className="w-full h-8 text-xs font-bold border-dashed border-primary text-primary hover:bg-primary/5">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add to List
                </Button>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="px-6 py-4 border-t border-border shrink-0">
          <Button variant="outline" onClick={onClose} disabled={loading} className="font-bold rounded-lg h-9">Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading} className="font-bold rounded-lg h-9 bg-primary">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
