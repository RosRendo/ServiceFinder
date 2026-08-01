"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/ui/ImageUpload";
import api from "@/lib/api/client";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ServiceType {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
}

export default function ServiceNew() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [companyId, setCompanyId] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedServiceType, setSelectedServiceType] = useState("");
  const [loadingServiceTypes, setLoadingServiceTypes] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Fetch service types when category changes
  useEffect(() => {
    if (selectedCategory) {
      fetchServiceTypesByCategory(selectedCategory);
    } else {
      setServiceTypes([]);
      setSelectedServiceType("");
    }
  }, [selectedCategory]);

  const fetchInitialData = async () => {
    try {
      // Fetch user's company
      const userResponse = await api.get("/auth/me");
      setCompanyId(userResponse.data.data?.company?.id || userResponse.data.data?.companyId);

      // Fetch categories
      const categoriesResponse = await api.get("/categories");
      const catData = categoriesResponse.data?.data || categoriesResponse.data;
      setCategories(Array.isArray(catData) ? catData : []);
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
      toast.error('Failed to load form data');
    }
  };

  const fetchServiceTypesByCategory = async (categoryId: string) => {
    setLoadingServiceTypes(true);
    setSelectedServiceType(""); // Reset service type

    try {
      // Find the category slug from the ID
      const category = categories.find(cat => cat.id === categoryId);
      if (!category) return;

      const typesResponse = await api.get(`/service-types/categories/${category.slug}`);
      setServiceTypes(typesResponse.data.data?.serviceTypes || []);
    } catch (error) {
      console.error('Failed to fetch service types:', error);
      toast.error('Failed to load service types');
      setServiceTypes([]);
    } finally {
      setLoadingServiceTypes(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const durationInput = formData.get("duration") as string;
    const durationMatch = durationInput.match(/(\d+)-(\d+)/);

    if (!durationMatch) {
      toast.error("Please enter duration in format: 180-240 (minutes)");
      setLoading(false);
      return;
    }

    const durationMin = parseInt(durationMatch[1]);
    const durationMax = parseInt(durationMatch[2]);

    const serviceData = {
      companyId: companyId,
      serviceTypeId: selectedServiceType,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      basePrice: parseFloat(formData.get("price") as string),
      durationMin,
      durationMax,
      features: (formData.get("features") as string).split(',').map(f => f.trim()).filter(Boolean),
      checklist: (formData.get("checklist") as string).split('\n').map(c => c.trim()).filter(Boolean),
      image: imageUrl || null,
      isActive
    };

    if (!serviceData.companyId || !serviceData.serviceTypeId) {
      toast.error("Company and Service Type are required");
      setLoading(false);
      return;
    }

    try {
      await api.post("/services", serviceData);

      toast.success("Service created successfully!");
      router.push("/company/services");
    } catch (error) {
      console.error('Error creating service:', error);
      toast.error(error instanceof Error ? error.message : "Failed to create service");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/company/services">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Add New Service</h1>
          <p className="text-muted-foreground mt-1">Create a new cleaning service offering</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Service Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category first" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(categories) && categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceType">Service Type *</Label>
              <Select
                value={selectedServiceType}
                onValueChange={setSelectedServiceType}
                disabled={!selectedCategory || loadingServiceTypes}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    loadingServiceTypes
                      ? "Loading service types..."
                      : selectedCategory
                        ? "Select service type"
                        : "Select category first"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Service Name *</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Deep Cleaning"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe your service..."
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="features">Features (Comma Separated)</Label>
              <Textarea
                id="features"
                name="features"
                placeholder="Vacuuming All Floors, Dust Surfaces, Empty Trash"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="checklist">Standard Task Checklist (Newline Separated)</Label>
              <Textarea
                id="checklist"
                name="checklist"
                placeholder="Clean all surfaces&#10;Empty trash bins&#10;Vacuum floors"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Service Image</Label>
              <ImageUpload
                value={imageUrl}
                onChange={setImageUrl}
                label="Upload Service Image"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Base Price ($) *</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes) *</Label>
                <Input
                  id="duration"
                  name="duration"
                  placeholder="e.g., 180-240"
                  required
                />
                <p className="text-xs text-muted-foreground">Format: min-max (e.g., 180-240)</p>
              </div>
            </div>

            <div className="flex items-center justify-between py-4 border-y border-border">
              <div>
                <Label htmlFor="active">Active Status</Label>
                <p className="text-sm text-muted-foreground">Make this service available for booking</p>
              </div>
              <Switch
                id="active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                asChild
                className="flex-1"
                disabled={loading}
              >
                <Link href="/company/services">Cancel</Link>
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={loading || !companyId || !selectedServiceType}
              >
                {loading ? "Creating..." : "Create Service"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}