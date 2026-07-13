"use client";

import { useState, useEffect } from "react";
import { format, startOfWeek, endOfWeek, addDays, isSameDay } from "date-fns";
import { Calendar as CalendarIcon, Loader2, Plus, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/lib/hooks/use-toast";
import api from "@/lib/api/client";

interface AvailabilitySlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export function StaffScheduleManager({ staffId }: { staffId: string }) {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const { toast } = useToast();

  const [generateOpen, setGenerateOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generateData, setGenerateData] = useState({
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: format(addDays(new Date(), 30), "yyyy-MM-dd"),
    startTime: "09:00",
    endTime: "17:00",
  });

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const startStr = format(currentWeekStart, "yyyy-MM-dd");
      const endStr = format(endOfWeek(currentWeekStart, { weekStartsOn: 1 }), "yyyy-MM-dd");
      
      const response = await api.get(`/companies/my-company/staff/${staffId}/availability?startDate=${startStr}&endDate=${endStr}`);
      setSlots(response.data.data || response.data || []);
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to load schedule", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (staffId) fetchSchedule();
  }, [staffId, currentWeekStart]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      // Format time to iso string for backend
      const today = new Date().toISOString().split("T")[0];
      const startTimeIso = new Date(`${today}T${generateData.startTime}:00Z`).toISOString();
      const endTimeIso = new Date(`${today}T${generateData.endTime}:00Z`).toISOString();

      await api.post(`/companies/my-company/staff/${staffId}/availability/generate`, {
        startDate: generateData.startDate,
        endDate: generateData.endDate,
        startTime: startTimeIso,
        endTime: endTimeIso,
        daysOff: [0, 6], // default weekends off for now
      });

      toast({ title: "Success", description: "Schedule generated successfully." });
      setGenerateOpen(false);
      fetchSchedule();
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to generate schedule", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleRemoveSlot = async (slotId: string) => {
    try {
      await api.delete(`/companies/my-company/availability/${slotId}`);
      setSlots((prev) => prev.filter((s) => s.id !== slotId));
      toast({ title: "Slot removed", description: "Staff marked as unavailable." });
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to remove slot", variant: "destructive" });
    }
  };

  // Generate days for the week view
  const weekDays = [...Array(7)].map((_, i) => addDays(currentWeekStart, i));

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm mt-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-primary" /> Weekly Schedule
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCurrentWeekStart(addDays(currentWeekStart, -7))}>Prev Week</Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentWeekStart(addDays(currentWeekStart, 7))}>Next Week</Button>
          <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="ml-2">
                <Plus className="w-4 h-4 mr-1" /> Generate
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate Schedule</DialogTitle>
                <DialogDescription>Set the working hours for this staff member.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input type="date" value={generateData.startDate} onChange={(e) => setGenerateData({ ...generateData, startDate: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input type="date" value={generateData.endDate} onChange={(e) => setGenerateData({ ...generateData, endDate: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input type="time" value={generateData.startTime} onChange={(e) => setGenerateData({ ...generateData, startTime: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input type="time" value={generateData.endTime} onChange={(e) => setGenerateData({ ...generateData, endTime: e.target.value })} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setGenerateOpen(false)}>Cancel</Button>
                <Button onClick={handleGenerate} disabled={generating}>
                  {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Generate
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="h-32 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, i) => {
            const daySlots = slots.filter(s => isSameDay(new Date(s.date), day));
            return (
              <div key={i} className="border border-gray-100 rounded-md p-2 text-center min-h-[100px] flex flex-col items-center bg-gray-50/50">
                <div className="text-xs font-semibold text-gray-500 uppercase">{format(day, "EEE")}</div>
                <div className="text-sm font-bold text-gray-900 mb-2">{format(day, "d")}</div>
                {daySlots.length > 0 ? (
                  daySlots.map(slot => (
                    <div key={slot.id} className="relative group w-full bg-blue-50 border border-blue-100 rounded text-xs py-1 px-1 mt-1 text-blue-700">
                      {format(new Date(slot.startTime), "HH:mm")} - {format(new Date(slot.endTime), "HH:mm")}
                      <button 
                        onClick={() => handleRemoveSlot(slot.id)}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove time off"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-gray-400 mt-2 italic">Off</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
