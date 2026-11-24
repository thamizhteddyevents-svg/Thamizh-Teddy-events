
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      console.error("Supabase environment variables are missing");
      return NextResponse.json(
        { success: false, message: "Server configuration error" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const body = await request.json();

    const customerName = String(body.customerName ?? "").trim();
    const mobileNumber = String(body.mobileNumber ?? "").trim();
    const email = String(body.email ?? "").trim();
    const eventCategory = String(body.eventCategory ?? "").trim();
    const eventDate = String(body.eventDate ?? "").trim();
    const eventLocation = String(body.eventLocation ?? "").trim();
    const eventDescription = String(body.eventDescription ?? "").trim();
    const additionalRequirements = String(
      body.additionalRequirements ?? ""
    ).trim();

    if (
      !customerName ||
      !mobileNumber ||
      !email ||
      !eventCategory ||
      !eventDate ||
      !eventLocation
    ) {
      return NextResponse.json(
        { success: false, message: "Please fill all required fields." },
        { status: 400 }
      );
    }

     

if (
  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
  !/^[0-9+\-\s()]{7,20}$/.test(mobileNumber) ||
  !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)
) {
  return NextResponse.json(
    { success: false, message: "Invalid booking details." },
    { status: 400 }
  );
}



    const bookingNumber =
      "TTE-" +
      Date.now().toString(36).toUpperCase() +
      "-" +
      randomUUID().slice(0, 6).toUpperCase();

    const { data, error } = await supabase
      .from("bookings")
      .insert({
        booking_number: bookingNumber,
        customer_name: customerName,
        mobile_number: mobileNumber,
        email: email,
        event_category: eventCategory,
        event_date: eventDate,
        event_location: eventLocation,
        event_description: eventDescription,
        additional_requirements: additionalRequirements,
        status: "pending",
        qr_token: null,
      })
      .select("booking_number")
      .single();

    if (error) {
      console.error("Booking database error:", error);
      return NextResponse.json(
        { success: false, message: "Unable to save booking." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Booking submitted successfully!",
        bookingNumber: data.booking_number,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Booking API error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to process booking." },
      { status: 500 }
    );
  }
}
