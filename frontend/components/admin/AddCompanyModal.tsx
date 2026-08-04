import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Building2, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/lib/hooks/use-toast";
import api from "@/lib/api/client";
import { ImageUpload } from "@/components/ui/ImageUpload";
import LocationSelector from "@/components/map/LocationSelector";

export function AddCompanyModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess?: () => void }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);
  
  // State for the temporary service being added
  const [tempService, setTempService] = useState({
      name: "", typeId: "", basePrice: "", durationMin: "", description: ""
  });
  
  useEffect(() => {
      if (open) {
          api.get('/service-types').then(res => {
              const payload = res.data.data || res.data;
              setServiceTypes(Array.isArray(payload) ? payload : payload.data || []);
          }).catch(() => {});
      }
  }, [open]);

  const [formData, setFormData] = useState({
    ownerName: "", ownerEmail: "", ownerPassword: "",
    companyName: "", companyDescription: "", companyPhone: "", companyEmail: "",
    companyAddress: "", companyCity: "", latitude: "", longitude: "",
    logoUrl: "", coverImageUrl: "",
    services: [] as any[]
  });

  const handleAddService = () => {
      if (!tempService.name || !tempService.typeId) {
          toast({ title: "Error", description: "Service Name and Category are required.", variant: "destructive" });
          return;
      }
      setFormData({
          ...formData,
          services: [...formData.services, {
              ...tempService,
              typeId: Number(tempService.typeId),
              basePrice: tempService.basePrice ? Number(tempService.basePrice) : undefined,
              durationMin: tempService.durationMin ? Number(tempService.durationMin) : undefined,
          }]
      });
      setTempService({ name: "", typeId: "", basePrice: "", durationMin: "", description: "" });
  };

  const handleRemoveService = (index: number) => {
      const newServices = [...formData.services];
      newServices.splice(index, 1);
      setFormData({ ...formData, services: newServices });
  };

  const handleSubmit = async () => {
    if (!formData.ownerName || !formData.ownerEmail || !formData.ownerPassword || !formData.companyName) {
      toast({ title: "Error", description: "Please fill in all required fields (*)", variant: "destructive" });
      return;
    }
    
    setLoading(true);
    try {
      const payload: any = { ...formData };
      if (payload.latitude) payload.latitude = Number(payload.latitude);
      if (payload.longitude) payload.longitude = Number(payload.longitude);

      await api.post("/admin/companies", payload);
      toast({ title: "Success", description: "Company created successfully" });
      
      setFormData({ 
          ownerName: "", ownerEmail: "", ownerPassword: "", 
          companyName: "", companyDescription: "", companyPhone: "", companyEmail: "",
          companyAddress: "", companyCity: "", latitude: "", longitude: "",
          logoUrl: "", coverImageUrl: "",
          services: []
      });
      setActiveTab("basic");
      onSuccess?.();
      onClose();
    } catch (err: any) {
      toast({ title: "Error", description: err.response?.data?.message || "Failed to create company", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" /> Add New Company
          </DialogTitle>
          <DialogDescription>
            Onboard a new company with full details (location, initial services, and admin).
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col mt-2">
          <TabsList className="grid w-full grid-cols-4 shrink-0">
            <TabsTrigger value="basic">Basic & Admin</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto p-1 mt-4 custom-scrollbar">
            <TabsContent value="basic" className="space-y-4 m-0">
              <div className="space-y-3">
                <Label>Company Name <span className="text-rose-500">*</span></Label>
                <Input value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} placeholder="Acme Cleaning" />
                
                <Label>About / Description</Label>
                <Textarea value={formData.companyDescription} onChange={e => setFormData({...formData, companyDescription: e.target.value})} placeholder="We are the best cleaning company..." />
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Company Phone</Label>
                    <Input value={formData.companyPhone} onChange={e => setFormData({...formData, companyPhone: e.target.value})} placeholder="(555) 123-4567" />
                  </div>
                  <div>
                    <Label>Company Email</Label>
                    <Input value={formData.companyEmail} onChange={e => setFormData({...formData, companyEmail: e.target.value})} placeholder="contact@acme.com" />
                  </div>
                </div>
              </div>
              <div className="border-t pt-4 space-y-3">
                <h4 className="text-sm font-bold text-muted-foreground">Admin Account</h4>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <Label>Owner Name <span className="text-rose-500">*</span></Label>
                        <Input value={formData.ownerName} onChange={e => setFormData({...formData, ownerName: e.target.value})} placeholder="John Doe" />
                    </div>
                    <div>
                        <Label>Owner Email <span className="text-rose-500">*</span></Label>
                        <Input value={formData.ownerEmail} onChange={e => setFormData({...formData, ownerEmail: e.target.value})} placeholder="john@example.com" />
                    </div>
                </div>
                <Label>Temporary Password <span className="text-rose-500">*</span></Label>
                <Input type="password" value={formData.ownerPassword} onChange={e => setFormData({...formData, ownerPassword: e.target.value})} placeholder="Min 6 chars" />
              </div>
            </TabsContent>

            <TabsContent value="location" className="space-y-4 m-0">
              <Label>Street Address</Label>
              <Input value={formData.companyAddress} onChange={e => setFormData({...formData, companyAddress: e.target.value})} placeholder="123 Main St" />
              
              <Label>City</Label>
              <Input value={formData.companyCity} onChange={e => setFormData({...formData, companyCity: e.target.value})} placeholder="New York" />
              
              <div className="pt-4 mt-4 border-t border-border/50">
                <Label className="mb-2 block">Map Location</Label>
                
                <div className="mt-2">
                  {activeTab === "location" && (
                    <LocationSelector 
                      lat={formData.latitude ? Number(formData.latitude) : 11.5564} 
                      lng={formData.longitude ? Number(formData.longitude) : 104.9282} 
                      onChange={(lat, lng) => setFormData({...formData, latitude: lat.toString(), longitude: lng.toString()})} 
                    />
                  )}
                </div>

                {formData.latitude && formData.longitude && (
                  <div className="mt-3 p-3 bg-muted rounded-md border border-border flex items-center justify-between text-xs font-mono">
                    <span className="text-muted-foreground truncate mr-3">Selected Location</span>
                    <span className="text-primary whitespace-nowrap shrink-0">{Number(formData.latitude).toFixed(5)}, {Number(formData.longitude).toFixed(5)}</span>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="media" className="space-y-6 m-0">
              <div>
                <Label className="block mb-2 text-sm font-bold">Company Logo</Label>
                <p className="text-xs text-muted-foreground mb-3">Upload a square logo for the company profile.</p>
                <div className="w-48">
                  <ImageUpload 
                    value={formData.logoUrl} 
                    onChange={url => setFormData({...formData, logoUrl: url})} 
                    label="Upload Logo" 
                  />
                </div>
              </div>
              
              <div className="border-t border-border/50 pt-4">
                <Label className="block mb-2 text-sm font-bold">Cover Image</Label>
                <p className="text-xs text-muted-foreground mb-3">Upload a wide cover image for the company banner.</p>
                <ImageUpload 
                  value={formData.coverImageUrl} 
                  onChange={url => setFormData({...formData, coverImageUrl: url})} 
                  label="Upload Cover Image" 
                />
              </div>
            </TabsContent>

            <TabsContent value="services" className="space-y-4 m-0">
                <p className="text-xs text-muted-foreground">Add multiple services so the company is instantly bookable across multiple categories.</p>
                
                {formData.services.length > 0 && (
                    <div className="space-y-2 mb-4">
                        {formData.services.map((svc, i) => (
                            <div key={i} className="flex flex-col gap-1 p-3 bg-muted/30 border border-border rounded-lg relative pr-10">
                                <span className="text-sm font-bold text-foreground">{svc.name}</span>
                                <span className="text-xs text-muted-foreground">{serviceTypes.find(t => t.id === svc.typeId)?.name || 'Category'} • ${svc.basePrice || '0'} • {svc.durationMin || '0'} mins</span>
                                <button type="button" onClick={() => handleRemoveService(i)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 rounded-md transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="p-4 bg-muted/10 border border-border/50 rounded-xl space-y-3">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Add New Service</h5>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label className="text-xs">Service Name <span className="text-rose-500">*</span></Label>
                            <Input value={tempService.name} onChange={e => setTempService({...tempService, name: e.target.value})} placeholder="Deep Clean" className="h-8 text-sm" />
                        </div>
                        <div>
                            <Label className="text-xs">Category <span className="text-rose-500">*</span></Label>
                            <Select value={tempService.typeId} onValueChange={(v) => setTempService({...tempService, typeId: v})}>
                                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                                <SelectContent>
                                    {serviceTypes.map(t => (
                                        <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label className="text-xs">Base Price ($)</Label>
                            <Input type="number" value={tempService.basePrice} onChange={e => setTempService({...tempService, basePrice: e.target.value})} placeholder="50.00" className="h-8 text-sm" />
                        </div>
                        <div>
                            <Label className="text-xs">Duration (mins)</Label>
                            <Input type="number" value={tempService.durationMin} onChange={e => setTempService({...tempService, durationMin: e.target.value})} placeholder="60" className="h-8 text-sm" />
                        </div>
                    </div>

                    <div>
                        <Label className="text-xs">Description</Label>
                        <Textarea value={tempService.description} onChange={e => setTempService({...tempService, description: e.target.value})} placeholder="Details..." className="h-16 text-sm resize-none" />
                    </div>

                    <Button type="button" onClick={handleAddService} variant="outline" size="sm" className="w-full mt-2 h-8 text-xs font-bold">
                        <Plus className="w-3 h-3 mr-1" /> Add to List
                    </Button>
                </div>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="shrink-0 mt-4 border-t pt-4">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading} className="font-bold">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Create Company
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
