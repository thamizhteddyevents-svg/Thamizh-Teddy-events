

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';

type Booking = {
  id: string;
  booking_number: string;
  customer_name: string;
  mobile_number: string;
  email: string;
  event_category: string;
  event_date: string;
  event_location: string;
  event_description: string;
  additional_requirements: string;
  status: 'pending' | 'approved' | 'rejected';
  qr_token: string | null;
  created_at: string;
};

export default function AdminDashboard() {
  const router = useRouter();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  async function loadBookings() {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      setMessage('Unable to load bookings. Please refresh.');
      return;
    }

    setBookings((data || []) as Booking[]);
  }

  useEffect(() => {
    let active = true;

    async function initialize() {
      if (!isSupabaseConfigured) {
        router.replace('/admin');
        return;
      }

      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        router.replace('/admin');
        return;
      }

      const { data: admin, error } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', data.user.id)
        .maybeSingle();

      if (!active) return;

      if (error || !admin) {
        await supabase.auth.signOut();
        router.replace('/admin');
        return;
      }

      setAdminEmail(data.user.email || '');

      await loadBookings();

      if (active) setLoading(false);
    }

    initialize();

    return () => {
      active = false;
    };
  }, [router]);

  async function updateBooking(
    booking: Booking,
    newStatus: 'approved' | 'rejected'
  ) {
    const confirmed = window.confirm(
      `Are you sure you want to ${newStatus} booking ${booking.booking_number}?`
    );

    if (!confirmed) return;

    setBusyId(booking.id);
    setMessage('');

    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError || !sessionData.session?.access_token) {
        throw new Error('Session expired. Please log in again.');
      }

      const response = await fetch('/api/bookings/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({
          bookingId: booking.id,
          status: newStatus,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Booking update failed.');
      }

      setBookings((previous) =>
        previous.map((item) =>
          item.id === booking.id
            ? {
                ...item,
                status: result.booking.status,
                qr_token: result.booking.qr_token,
              }
            : item
        )
      );

      if (newStatus === 'approved') {
        setMessage(
          result.emailSent
            ? `Booking ${booking.booking_number} approved. QR Code and approval email sent successfully.`
            : `Booking ${booking.booking_number} approved, but approval email could not be sent. Please check the server logs.`
        );
      } else {
        setMessage(
          `Booking ${booking.booking_number} rejected successfully.`
        );
      }
    } catch (error) {
      console.error('Booking update error:', error);

      setMessage(
        error instanceof Error
          ? error.message
          : 'Unable to update booking. Please try again.'
      );
    } finally {
      setBusyId(null);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace('/admin');
  }

  const pending = bookings.filter(
    (b) => b.status === 'pending'
  ).length;

  const approved = bookings.filter(
    (b) => b.status === 'approved'
  ).length;

  const rejected = bookings.filter(
    (b) => b.status === 'rejected'
  ).length;

  const stats = [
    { title: 'Total Bookings', count: bookings.length },
    { title: 'Pending', count: pending },
    { title: 'Approved', count: approved },
    { title: 'Rejected', count: rejected },
  ];

  return (
    <main className="relative isolate min-h-screen bg-[#073B3A] text-white">

      {/* FULL SCREEN VIDEO BACKGROUND */}
      <div className="fixed inset-0 z-0 h-screen w-screen overflow-hidden pointer-events-none">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source
            src="/videos/teddy-dance.mp4"
            type="video/mp4"
          />
        </video>

        {/* TEAL OVERLAY */}
        <div className="absolute inset-0 bg-[#073B3A]/20" />
      </div>

      {/* DASHBOARD CONTENT */}
      <div className="relative z-10 min-h-screen">

        {/* HEADER */}
        <header className="sticky top-0 z-20 border-b border-teal-300/40 bg-[#073B3A]/75 px-4 py-5 backdrop-blur-md sm:px-6">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">

            <div>
              <h1 className="text-xl font-extrabold tracking-wide text-teal-100 sm:text-2xl">
                THAMIZH TEDDY EVENTS
              </h1>

              <p className="mt-1 text-xs tracking-[0.3em] text-teal-200">
                ADMIN CONTROL PANEL
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-teal-100 sm:block">
                {adminEmail}
              </span>

              <button
                onClick={logout}
                className="rounded-lg border border-teal-200 bg-teal-700/70 px-4 py-2 text-sm font-bold text-white transition hover:bg-teal-300 hover:text-teal-950"
              >
                LOGOUT
              </button>
            </div>

          </div>
        </header>

        {/* MAIN SECTION */}
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">

          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-teal-200">
              Welcome Back
            </p>

            <h2 className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">
              Admin Dashboard
            </h2>

            <p className="mt-3 text-teal-50">
              Manage customer bookings and event requests.
            </p>
          </div>

          {message && (
            <div className="mb-6 rounded-xl border border-teal-200/50 bg-[#0F766E]/90 p-4 text-white backdrop-blur-md">
              {message}
            </div>
          )}

          {loading ? (
            <div className="rounded-2xl border border-teal-200/50 bg-[#0F766E]/70 py-20 text-center backdrop-blur-md">
              <p className="animate-pulse text-lg font-semibold text-teal-50">
                Loading Dashboard...
              </p>
            </div>
          ) : (
            <>

              {/* STATISTICS */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">

                {stats.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-teal-200/50 bg-[#0F766E]/65 p-6 shadow-xl backdrop-blur-md transition hover:bg-[#115E59]/85"
                  >
                    <p className="text-sm font-medium text-teal-50">
                      {item.title}
                    </p>

                    <p className="mt-4 text-4xl font-extrabold text-white">
                      {item.count}
                    </p>
                  </div>
                ))}

              </div>

              {/* CUSTOMER BOOKINGS */}
              <div className="mt-12 overflow-hidden rounded-2xl border border-teal-200/50 bg-[#073B3A]/65 shadow-2xl backdrop-blur-md">

                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-teal-200/30 bg-[#0F766E]/60 px-5 py-5 sm:px-6">
                  <div>
                    <h3 className="text-xl font-bold text-teal-50">
                      Customer Bookings
                    </h3>

                    <p className="mt-1 text-sm text-teal-100">
                      View and manage all event requests.
                    </p>
                  </div>

                  <button
                    onClick={loadBookings}
                    className="rounded-lg border border-teal-200/70 bg-teal-700/60 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-300 hover:text-teal-950"
                  >
                    REFRESH
                  </button>
                </div>

                {bookings.length === 0 ? (
                  <div className="p-12 text-center">
                    <p className="text-lg font-semibold text-teal-50">
                      No Bookings Found
                    </p>

                    <p className="mt-2 text-teal-100">
                      New customer bookings will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">

                    <table className="w-full min-w-[1100px] text-left text-sm">

                      <thead className="bg-[#115E59]/90 text-teal-50">
                        <tr>
                          <th className="p-4">Booking ID</th>
                          <th className="p-4">Customer Details</th>
                          <th className="p-4">Event</th>
                          <th className="p-4">Date</th>
                          <th className="p-4">Location</th>
                          <th className="p-4">Status</th>
                          <th className="p-4">Action</th>
                        </tr>
                      </thead>

                      <tbody>
                        {bookings.map((booking) => (
                          <tr
                            key={booking.id}
                            className="border-t border-teal-200/20 transition hover:bg-teal-800/50"
                          >

                            <td className="p-4 font-semibold text-teal-100">
                              {booking.booking_number}
                            </td>

                            <td className="p-4">
                              <p className="font-bold text-white">
                                {booking.customer_name}
                              </p>

                              <p className="mt-1 text-teal-100">
                                {booking.mobile_number}
                              </p>

                              <p className="text-teal-100">
                                {booking.email}
                              </p>
                            </td>

                            <td className="p-4 text-white">
                              {booking.event_category}
                            </td>

                            <td className="p-4 text-white">
                              {booking.event_date}
                            </td>

                            <td className="p-4 text-white">
                              {booking.event_location}
                            </td>

                            <td className="p-4">
                              <span
                                className={
                                  booking.status === 'approved'
                                    ? 'font-bold text-emerald-200'
                                    : booking.status === 'rejected'
                                    ? 'font-bold text-orange-200'
                                    : 'font-bold text-cyan-200'
                                }
                              >
                                {booking.status.toUpperCase()}
                              </span>
                            </td>

                            <td className="p-4">
                              {booking.status === 'pending' ? (
                                <div className="flex gap-2">

                                  <button
                                    disabled={busyId === booking.id}
                                    onClick={() =>
                                      updateBooking(booking, 'approved')
                                    }
                                    className="rounded-lg bg-emerald-600 px-3 py-2 font-bold text-white transition hover:bg-emerald-500 disabled:opacity-50"
                                  >
                                    {busyId === booking.id
                                      ? 'WAIT...'
                                      : 'ACCEPT'}
                                  </button>

                                  <button
                                    disabled={busyId === booking.id}
                                    onClick={() =>
                                      updateBooking(booking, 'rejected')
                                    }
                                    className="rounded-lg bg-orange-700 px-3 py-2 font-bold text-white transition hover:bg-orange-600 disabled:opacity-50"
                                  >
                                    REJECT
                                  </button>

                                </div>
                              ) : (
                                <span className="text-teal-100">
                                  No action
                                </span>
                              )}
                            </td>

                          </tr>
                        ))}
                      </tbody>

                    </table>

                  </div>
                )}

              </div>

            </>
          )}

          <footer className="mt-12 border-t border-teal-200/30 py-6 text-center text-sm text-teal-100">
            © {new Date().getFullYear()} Thamizh Teddy Events. All Rights Reserved.
          </footer>

        </section>
      </div>
    </main>
  );
}
