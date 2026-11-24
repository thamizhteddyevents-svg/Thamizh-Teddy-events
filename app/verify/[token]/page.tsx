
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Booking Verification - Thamizh Teddy Events",
  robots: {
    index: false,
    follow: false,
  },
};

type Props = {
  params: Promise<{
    token: string;
  }>;
};

export default async function VerifyBookingPage({ params }: Props) {
  const { token } = await params;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey || !token) {
    return <VerificationMessage valid={false} />;
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: booking, error } = await supabase
    .from("bookings")
    .select(
      "booking_number, customer_name, event_category, event_date, event_location, status"
    )
    .eq("qr_token", token)
    .maybeSingle();

  if (error || !booking || booking.status !== "approved") {
    return <VerificationMessage valid={false} />;
  }

  return (
    <main className="min-h-screen bg-[#073B3A] px-4 py-12 text-white">
      <div className="mx-auto max-w-xl">
        <div className="rounded-3xl border border-teal-300/40 bg-[#0F766E] p-7 shadow-2xl sm:p-10">

          <div className="text-center">
            <h1 className="text-2xl font-extrabold text-teal-100 sm:text-3xl">
              THAMIZH TEDDY EVENTS
            </h1>

            <p className="mt-2 text-xs tracking-[0.3em] text-teal-200">
              BOOKING VERIFICATION
            </p>

            <div className="mx-auto mt-8 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 text-5xl">
              ✓
            </div>

            <h2 className="mt-5 text-2xl font-bold text-white">
              VALID BOOKING
            </h2>

            <p className="mt-2 font-semibold text-emerald-200">
              Booking Approved Successfully
            </p>
          </div>

          <div className="mt-8 space-y-4 rounded-2xl bg-[#073B3A]/70 p-5">

            <Detail label="Booking ID" value={booking.booking_number} />

            <Detail label="Customer Name" value={booking.customer_name} />

            <Detail label="Event Category" value={booking.event_category} />

            <Detail label="Event Date" value={booking.event_date} />

            <Detail label="Event Location" value={booking.event_location} />

            <div className="border-t border-teal-200/30 pt-4">
              <p className="text-sm text-teal-200">Booking Status</p>
              <p className="mt-1 font-bold text-emerald-300">
                APPROVED
              </p>
            </div>

          </div>

          <p className="mt-7 text-center text-sm text-teal-100">
            Thank you for choosing Thamizh Teddy Events!
          </p>

        </div>
      </div>
    </main>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border-b border-teal-200/20 pb-3 last:border-0">
      <p className="text-sm text-teal-200">{label}</p>
      <p className="mt-1 break-words font-semibold text-white">
        {value || "Not Available"}
      </p>
    </div>
  );
}

function VerificationMessage({ valid }: { valid: boolean }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#073B3A] px-4 text-white">
      <div className="w-full max-w-md rounded-3xl border border-red-300/30 bg-[#0F766E] p-8 text-center shadow-2xl">
        <div className="text-5xl">✕</div>
        <h1 className="mt-5 text-2xl font-bold">
          {valid ? "Verification Error" : "INVALID QR CODE"}
        </h1>
        <p className="mt-3 text-teal-100">
          This booking QR Code is invalid or could not be verified.
          Please contact Thamizh Teddy Events.
        </p>
      </div>
    </main>
  );
}
