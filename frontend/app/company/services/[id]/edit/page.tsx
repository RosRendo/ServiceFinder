"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useState, useEffect } from "react";

export default function ServiceEdit() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [service, setService] = useState<any>(null);

  useEffect(() => {
    const fetchService = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/services/${id}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            },
            credentials: 'include'
          }
        );


        if (response.ok) {
          const data = await response.json();
          setService(data.data);
          setIsActive(data.data.isActive);
        }
      } catch (error) {
        toast.error("Failed to load service");
      }
    };

    if (id) {
      fetchService();
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const durationInput = formData.get("duration") as string;
    const durationMatch = durationInput.match(/(\d+)-(\d+)/);

    const updateData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      basePrice: parseFloat(formData.get("price") as string),
      durationMin: durationMatch ? parseInt(durationMatch[1]) : service.durationMin,
      durationMax: durationMatch ? parseInt(durationMatch[2]) : service.durationMax,
      features: (formData.get("features") as string).split(',').map(f => f.trim()).filter(Boolean),
      image: formData.get("image") as string || null,
      isActive
    };

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/services/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(updateData),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to update service");
      }

      toast.success("Service updated successfully!");
      router.push("/company/services");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update service");
    } finally {
      setLoading(false);
    }
  };

  if (!service) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/company/services">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Edit Service</h1>
          <p className="text-muted-foreground mt-1">Update service details</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Service Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Service Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={service.name}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={service.description}
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="features">Features (Comma Separated)</Label>
              <Textarea
                id="features"
                name="features"
                defaultValue={service.features?.join(', ')}
                placeholder="Vacuuming All Floors, Dust Surfaces"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Image URL</Label>
              <Input
                id="image"
                name="image"
                defaultValue={service.image || ''}
                placeholder="https://images.unsplash.com/..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Base Price ($)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  defaultValue={service.basePrice}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Estimated Duration</Label>
                <Input
                  id="duration"
                  name="duration"
                  defaultValue={`${service.durationMin}-${service.durationMax}`}
                  required
                />
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
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}