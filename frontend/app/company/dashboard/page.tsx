"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, AlertCircle, TrendingUp, Users, CalendarCheck, Wallet, Clock, User, MapPin, CheckCircle2 } from "lucide-react";

import { useBookings } from "@/lib/hooks/useBookings";
import { useReviews } from "@/lib/hooks/useReviews";
import { format, isToday, isTomorrow, isAfter, startOfToday, parseISO } from "date-fns";

const statusStyle: Record<string, string> = {
  "pending": "bg-amber-50 text-amber-700",
  "confirmed": "bg-blue-50 text-blue-700",
  "in_progress": "bg-indigo-50 text-indigo-700",
  "completed": "bg-emerald-50 text-emerald-700",
  "cancelled": "bg-rose-50 text-rose-700",
};

export default function CompanyDashboardPage() {
  const { bookings, loading: loadingBookings } = useBookings({ limit: 50 });
  const { reviews, loading: loadingReviews } = useReviews({ limit: 5 });

  const loading = loadingBookings || loadingReviews;

  const today = startOfToday();
  
  const todayBookings = bookings.filter(b => {
    if (!b.scheduledDate) return false;
    return isToday(parseISO(b.scheduledDate.toString()));
  });

  const upcomingBookings = bookings.filter(b => {
    if (!b.scheduledDate) return false;
    return isAfter(parseISO(b.scheduledDate.toString()), today) && !isToday(parseISO(b.scheduledDate.toString()));
  });

  const activeJobs = todayBookings.map(b => ({
    id: `BK-${b.id}`,
    time: b.scheduledTime || "TBD",
    status: b.status,
    staff: b.staff?.user?.fullName || "Unassigned",
    service: b.service?.name || "Service"
  }));

  const upcoming = upcomingBookings.slice(0, 5).map(b => ({
    id: `BK-${b.id}`,
    date: isTomorrow(parseISO(b.scheduledDate!.toString())) ? "Tomorrow" : format(parseISO(b.scheduledDate!.toString()), "MMM dd"),
    time: b.scheduledTime || "TBD",
    service: b.service?.name || "Service",
    staff: b.staff?.user?.fullName || "Unassigned",
    area: b.address || "TBD"
  }));

  const recentReviews = reviews.map(r => ({
    id: Number(r.id),
    customer: r.customer?.fullName || "Customer",
    rating: r.rating,
    text: r.comment || "",
    date: format(parseISO(r.createdAt!.toString()), "MMM dd")
  }));

  const statCards = [
    { title: "Today's Jobs", value: todayBookings.length.toString(), change: `${todayBookings.filter(b => b.status === "pending").length} remaining`, icon: CalendarCheck, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Active Staff", value: "-", change: "Staff count", icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
    { title: "Weekly Revenue", value: "-", change: "vs last week", icon: Wallet, color: "text-emerald-600", bg: "bg-emerald-50" },
    { title: "Pending Actions", value: bookings.filter(b => b.status === "pending").length.toString(), change: "Requires attention", icon: AlertCircle, color: "text-rose-600", bg: "bg-rose-50" },
  ];

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-sm text-gray-400">Loading...</div>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Here's what's happening today</p>
        </div>
        <Link
          href="/company/bookings/new"
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
        >
          <Plus className="w-4 h-4" /> New Booking
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-500">{s.title}</span>
              <div className={`w-7 h-7 rounded-md flex items-center justify-center ${s.bg}`}>
                <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-400 mt-1">{s.change}</div>
          </div>
        ))}
      </div>

      {/* Main Two-Column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Dispatch Table */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Today's Dispatch</h2>
            <Link href="/company/bookings" className="text-xs text-blue-600 font-medium hover:underline">View all</Link>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 font-medium border-b border-gray-100">
                <th className="px-5 py-2.5 text-left">Time</th>
                <th className="px-5 py-2.5 text-left">Job ID</th>
                <th className="px-5 py-2.5 text-left">Service</th>
                <th className="px-5 py-2.5 text-left">Staff</th>
                <th className="px-5 py-2.5 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {activeJobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-900">{job.time}</td>
                  <td className="px-5 py-3 text-gray-400 font-mono text-xs">{job.id}</td>
                  <td className="px-5 py-3 text-gray-700">{job.service}</td>
                  <td className="px-5 py-3 text-gray-500">{job.staff}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusStyle[job.status] || "bg-gray-100 text-gray-600"}`}>
                      {job.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Action Items */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Requires Action</h2>
          </div>
          <div className="divide-y divide-gray-50">
            <div className="px-4 py-3.5 flex gap-3 border-l-2 border-l-rose-400 bg-rose-50/30">
              <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-semibold text-gray-800">Unassigned Booking</div>
                <div className="text-xs text-gray-500 mt-0.5">BK-1003 at 02:00 PM needs a team</div>
              </div>
            </div>
            <div className="px-4 py-3.5 flex gap-3 border-l-2 border-l-amber-400 bg-amber-50/30">
              <Clock className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-semibold text-gray-800">Pending Dispute</div>
                <div className="text-xs text-gray-500 mt-0.5">BK-8821 reported an issue. 24h SLA</div>
              </div>
            </div>
            <div className="px-5 py-4">
              <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Top Performers</h3>
              <div className="space-y-2.5">
                {[{ initials: "JS", name: "John Smith", rating: "5.0" }, { initials: "ED", name: "Emily Davis", rating: "4.8" }].map((p) => (
                  <div key={p.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                        {p.initials}
                      </div>
                      <span className="text-sm font-medium text-gray-800">{p.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />{p.rating}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Two-Column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Upcoming Schedule */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-indigo-400" /> Upcoming Schedule
            </h2>
            <Link href="/company/bookings" className="text-xs text-blue-600 font-medium hover:underline">View calendar</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {upcoming.map((apt) => (
              <div key={apt.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div>
                  <div className="text-sm font-medium text-gray-900">{apt.service}</div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{apt.date}, {apt.time}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{apt.area}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium text-gray-700">{apt.staff}</div>
                  <div className={`text-xs font-medium mt-0.5 ${apt.staff === "Unassigned" ? "text-amber-500" : "text-emerald-500"}`}>
                    {apt.staff === "Unassigned" ? "Needs Staff" : "Assigned"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Reviews */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> Recent Feedback
            </h2>
            <Link href="/company/reviews" className="text-xs text-blue-600 font-medium hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentReviews.map((r) => (
              <div key={r.id} className="px-5 py-3.5 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-gray-900">{r.customer}</span>
                  <span className="text-xs text-gray-400">{r.date}</span>
                </div>
                <div className="flex gap-0.5 mb-1.5">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className={`w-3.5 h-3.5 ${i < r.rating ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"}`} viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-xs text-gray-500 italic">"{r.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
