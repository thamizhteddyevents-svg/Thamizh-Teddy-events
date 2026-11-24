
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

async function sendApprovalEmail(params: Record<string, string>) {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;
  const templateId = process.env.EMAILJS_CUSTOMER_TEMPLATE_ID;

  if (!serviceId || !publicKey || !privateKey || !templateId) {
    throw new Error("EmailJS configuration is missing.");
  }

  const response = await fetch(
    "https://api.emailjs.com/api/v1.0/email/send",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        accessToken: privateKey,
        template_params: params,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`EmailJS error: ${errorText}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !anonKey || !serviceKey) {
      return NextResponse.json(
        { success: false, message: "Server configuration error." },
        { status: 500 }
      );
    }

    const authorization = request.headers.get("authorization");
    const accessToken = authorization?.startsWith("Bearer ")
      ? authorization.slice(7)
      : "";

    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: "Please log in again." },
        { status: 401 }
      );
    }

    const authClient = createClient(supabaseUrl, anonKey);

    const { data: authData, error: authError } =
      await authClient.auth.getUser(accessToken);

    if (authError || !authData.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 401 }
      );
    }

    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: admin, error: adminError } = await adminClient
      .from("admin_users")
      .select("user_id")
      .eq("user_id", authData.user.id)
      .maybeSingle();

    if (adminError || !admin) {
      return NextResponse.json(
        { success: false, message: "Admin access denied." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const bookingId = String(body.bookingId ?? "").trim();
    const newStatus = body.status;

    if (
      !bookingId ||
      (newStatus !== "approved" && newStatus !== "rejected")
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid booking details." },
        { status: 400 }
      );
    }

    const { data: booking, error: bookingError } = await adminClient
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .maybeSingle();

    if (bookingError || !booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found." },
        { status: 404 }
      );
    }

    if (booking.status !== "pending") {
      return NextResponse.json(
        {
          success: false,
          message: "This booking has already been processed.",
        },
        { status: 409 }
      );
    }

    const token = newStatus === "approved" ? randomUUID() : null;

    const { data: updatedBooking, error: updateError } =
      await adminClient
        .from("bookings")
        .update({
          status: newStatus,
          qr_token: token,
        })
        .eq("id", bookingId)
        .eq("status", "pending")
        .select("*")
        .single();

    if (updateError || !updatedBooking) {
      console.error("Booking update error:", updateError);

      return NextResponse.json(
        { success: false, message: "Unable to update booking." },
        { status: 500 }
      );
    }

    let emailSent = false;
    let emailError: string | null = null;

    if (newStatus === "approved" && token) {
      try {
        const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
        const currentOrigin = new URL(request.url).origin;

        const siteUrl = (
          configuredSiteUrl || currentOrigin
        ).replace(/\/+$/, "");

        const verificationUrl =
          `${siteUrl}/verify/${encodeURIComponent(token)}`;

        const qrUrl = new URL("https://quickchart.io/qr");
        qrUrl.searchParams.set("text", verificationUrl);
        qrUrl.searchParams.set("size", "300");
        qrUrl.searchParams.set("format", "png");

        await sendApprovalEmail({
          to_email: booking.email,
          customer_name: booking.customer_name,
          booking_id: booking.booking_number,
          event_category: booking.event_category,
          event_date: booking.event_date,
          event_location: booking.event_location,
          qr_code_url: qrUrl.toString(),
          is_approved: "true",
        });

        emailSent = true;
      } catch (error) {
        emailError =
          error instanceof Error ? error.message : String(error);

        console.error("Approval email failed:", emailError);
      }
    }

    return NextResponse.json({
      success: true,
      message:
        newStatus === "approved"
          ? "Booking approved successfully."
          : "Booking rejected successfully.",
      booking: updatedBooking,
      emailSent,
      emailError,
    });
  } catch (error) {
    console.error("Approval API error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to process this booking." },
      { status: 500 }
    );
  }
}
