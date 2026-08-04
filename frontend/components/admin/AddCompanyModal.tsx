import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Building2, Plus, Trash2, ImagePlus, X } from "lucide-react";
import { useToast } from "@/lib/hooks/use-toast";
import api from "@/lib/api/client";
import { ImageUpload } from "@/components/ui/ImageUpload";
import LocationSelector from "@/components/map/LocationSelector";
import { Switch } from "@/components/ui/switch";

export function AddCompanyModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess?: () => void }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);
  
  // State for the temporary service being added
  const [tempService, setTempService] = useState({
      name: "", typeId: "", basePrice: "", durationMin: "60", description: "", imageUrl: "", checklist: [] as string[]
  });
  const [checklistInput, setChecklistInput] = useState("");
  const [highlightInput, setHighlightInput] = useState("");
  
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
    description: "",
    establishedYear: "",
    isInsured: false,
    coverageRadiusKm: "50",
    cardHighlights: [] as string[],
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
      setTempService({ name: "", typeId: "", basePrice: "", durationMin: "60", description: "", imageUrl: "", checklist: [] });
      setChecklistInput("");
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
      const payload: any = { 
          ...formData,
          email: formData.companyEmail || undefined,
          description: formData.description || undefined,
          establishedYear: formData.establishedYear ? Number(formData.establishedYear) : undefined,
          isInsured: formData.isInsured,
          coverageRadiusKm: formData.coverageRadiusKm ? Number(formData.coverageRadiusKm) : 50,
          cardHighlights: formData.cardHighlights,
          latitude: formData.latitude ? Number(formData.latitude) : undefined,
          longitude: formData.longitude ? Number(formData.longitude) : undefined
      };

      await api.post("/admin/companies", payload);
      toast({ title: "Success", description: "Company created successfully" });
      
      setFormData({ 
          ownerName: "", ownerEmail: "", ownerPassword: "", 
          companyName: "", companyDescription: "", companyPhone: "", companyEmail: "",
          companyAddress: "", companyCity: "", latitude: "", longitude: "",
          logoUrl: "", coverImageUrl: "",
          description: "",
          establishedYear: "",
          isInsured: false,
          coverageRadiusKm: "50",
          cardHighlights: [],
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
                
                <div className="mt-4">
                  <Label>Company Description / About Us</Label>
                  <Textarea 
                    className="mt-1 resize-none h-20 text-sm" 
                    placeholder="Tell customers about your company, values, and why they should choose you..." 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                  />
                </div>

                <div className="mt-4 pt-4 border-t border-border/50">
                  <Label className="block mb-1">Company Highlights (Max 2)</Label>
                  <p className="text-xs text-muted-foreground mb-2">These appear as feature tags on the mobile app Explore feed (e.g. "24/7 Available", "Eco-Friendly")</p>
                  
                  <div className="flex gap-2 mb-2">
                      <Input 
                          value={highlightInput} 
                          onChange={e => setHighlightInput(e.target.value)} 
                          onKeyDown={e => {
                              if (e.key === 'Enter') {
                                  e.preventDefault();
                                  if (highlightInput.trim() && formData.cardHighlights.length < 2) {
                                      setFormData({...formData, cardHighlights: [...formData.cardHighlights, highlightInput.trim()]});
                                      setHighlightInput("");
                                  }
                              }
                          }}
                          disabled={formData.cardHighlights.length >= 2}
                          placeholder="e.g. Eco-Friendly (Press Enter)" 
                          className="h-8 text-sm flex-1" 
                      />
                      <Button type="button" variant="secondary" size="sm" className="h-8" disabled={formData.cardHighlights.length >= 2} onClick={() => {
                          if (highlightInput.trim() && formData.cardHighlights.length < 2) {
                              setFormData({...formData, cardHighlights: [...formData.cardHighlights, highlightInput.trim()]});
                              setHighlightInput("");
                          }
                      }}>Add</Button>
                  </div>
                  {formData.cardHighlights.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                          {formData.cardHighlights.map((tag, idx) => (
                              <div key={idx} className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-xs font-medium border border-primary/20">
                                  <span>{tag}</span>
                                  <button type="button" onClick={() => setFormData({...formData, cardHighlights: formData.cardHighlights.filter((_, i) => i !== idx)})} className="hover:text-rose-500 ml-1">
                                      <X className="w-3 h-3" />
                                  </button>
                              </div>
                          ))}
                      </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Established Year</Label>
                    <Input type="number" value={formData.establishedYear} onChange={e => setFormData({...formData, establishedYear: e.target.value})} placeholder="2020" />
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <Switch id="isInsured" checked={formData.isInsured} onCheckedChange={(c) => setFormData({...formData, isInsured: c})} />
                    <Label htmlFor="isInsured">Company is Insured</Label>
                  </div>
                </div>

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
                <div className="flex flex-col sm:flex-row justify-between sm:items-end mb-3 gap-2">
                  <Label className="block whitespace-nowrap mb-1 sm:mb-0">Map Location</Label>
                  <div className="w-full sm:w-2/3 md:w-1/2">
                    <Input 
                      className="h-8 text-sm placeholder:text-xs"
                      placeholder="Quick Pin: Paste a Google Maps Link (https://maps.app.goo.gl/...)" 
                      onChange={async (e) => {
                        const url = e.target.value;
                        if (url.startsWith('http') && (url.includes('map') || url.includes('goo.gl'))) {
                          toast({ title: "Parsing link...", description: "Extracting coordinates..." });
                          try {
                            const res = await fetch(`/api/parse-gmap?url=${encodeURIComponent(url)}`);
                            const data = await res.json();
                            if (data.lat && data.lng) {
                              setFormData({
                                  ...formData, 
                                  latitude: data.lat.toString(), 
                                  longitude: data.lng.toString()
                              });
                              toast({ title: "Coordinates Extracted!", description: `Map moved to ${data.lat.toFixed(4)}, ${data.lng.toFixed(4)}` });
                            } else {
                              toast({ title: "Extraction Failed", description: "Could not find coordinates in that link.", variant: "destructive" });
                            }
                          } catch(err) {
                             toast({ title: "Error", description: "Failed to parse link.", variant: "destructive" });
                          }
                          e.target.value = '';
                        }
                      }}
                    />
                  </div>
                </div>
                
                <div className="mt-2">
                  {activeTab === "location" && (
                    <LocationSelector 
                      lat={formData.latitude ? Number(formData.latitude) : 11.5564} 
                      lng={formData.longitude ? Number(formData.longitude) : 104.9282} 
                      onChange={(lat, lng) => setFormData({...formData, latitude: lat.toString(), longitude: lng.toString()})} 
                    />
                  )}
                </div>

                <div className="mt-4">
                  <Label>Coverage Radius (km)</Label>
                  <p className="text-xs text-muted-foreground mb-1">How far from the base location are you willing to travel for jobs?</p>
                  <Input type="number" value={formData.coverageRadiusKm} onChange={e => setFormData({...formData, coverageRadiusKm: e.target.value})} placeholder="50" className="w-1/3" />
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
                            <div key={i} className="flex items-center gap-3 p-3 bg-muted/30 border border-border rounded-lg relative pr-10">
                                {svc.imageUrl ? (
                                    <div className="w-12 h-12 rounded-md overflow-hidden bg-muted shrink-0 border border-border">
                                        <img src={svc.imageUrl} alt={svc.name} className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="w-12 h-12 rounded-md bg-muted shrink-0 border border-border flex items-center justify-center text-muted-foreground">
                                        <ImagePlus className="w-4 h-4 opacity-50" />
                                    </div>
                                )}
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-sm font-bold text-foreground">{svc.name}</span>
                                    <span className="text-xs text-muted-foreground">{serviceTypes.find(t => t.id === svc.typeId)?.name || 'Category'} • ${svc.basePrice || '0'} • {svc.durationMin || '0'} mins</span>
                                </div>
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <Label className="text-xs mb-2 block">Service Image (Optional)</Label>
                            <div className="aspect-video sm:aspect-square w-full">
                               <ImageUpload 
                                 value={tempService.imageUrl} 
                                 onChange={url => setTempService({...tempService, imageUrl: url})} 
                                 label="Photo" 
                               />
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <Label className="text-xs mb-2 block">Description</Label>
                            <Textarea 
                                value={tempService.description} 
                                onChange={e => setTempService({...tempService, description: e.target.value})} 
                                placeholder="Service details..." 
                                className="flex-1 min-h-[100px] text-sm resize-none" 
                            />
                        </div>
                    </div>

                    <div className="pt-2 border-t border-border/50">
                        <Label className="text-xs mb-2 block">What's Included? (Checklist)</Label>
                        <div className="flex gap-2 mb-2">
                            <Input 
                                value={checklistInput} 
                                onChange={e => setChecklistInput(e.target.value)} 
                                onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        if (checklistInput.trim()) {
                                            setTempService({...tempService, checklist: [...tempService.checklist, checklistInput.trim()]});
                                            setChecklistInput("");
                                        }
                                    }
                                }}
                                placeholder="e.g. Dashboard wipe down (Press Enter)" 
                                className="h-8 text-sm flex-1" 
                            />
                            <Button type="button" variant="secondary" size="sm" className="h-8" onClick={() => {
                                if (checklistInput.trim()) {
                                    setTempService({...tempService, checklist: [...tempService.checklist, checklistInput.trim()]});
                                    setChecklistInput("");
                                }
                            }}>Add</Button>
                        </div>
                        {tempService.checklist.length > 0 && (
                            <div className="flex flex-col gap-1 mt-2">
                                {tempService.checklist.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-muted/30 px-3 py-1.5 rounded-md border border-border/50">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                            <span className="text-xs">{item}</span>
                                        </div>
                                        <button type="button" onClick={() => setTempService({...tempService, checklist: tempService.checklist.filter((_, i) => i !== idx)})} className="text-muted-foreground hover:text-rose-500">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <Button type="button" onClick={handleAddService} variant="outline" size="sm" className="w-full mt-2 h-8 text-xs font-bold">
                        <Plus className="w-4 h-4 mr-2" /> Add Service to List
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
