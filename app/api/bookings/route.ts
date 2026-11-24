
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[char];
  });
}

async function sendEmailJS(
  templateId: string,
  templateParams: Record<string, string>
) {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  if (!serviceId || !publicKey || !privateKey || !templateId) {
    throw new Error("EmailJS environment variables are missing");
  }

  const response = await fetch(
    "https://api.emailjs.com/api/v1.0/email/send",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        accessToken: privateKey,
        template_params: templateParams,
      }),
    }
  );

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(
      `EmailJS failed (${response.status}): ${responseText}`
    );
  }

  return responseText;
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        {
          success: false,
          message: "Server configuration error",
        },
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
        {
          success: false,
          message: "Please fill all required fields.",
        },
        { status: 400 }
      );
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !/^[0-9+\-()\s]{7,20}$/.test(mobileNumber) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid booking details.",
        },
        { status: 400 }
      );
    }

    const bookingNumber =
      "TTE-" +
      Date.now().toString(36).toUpperCase() +
      "-" +
      randomUUID().slice(0, 6).toUpperCase();

    // Save booking in Supabase
    const { data, error } = await supabase
      .from("bookings")
      .insert({
        booking_number: bookingNumber,
        customer_name: customerName,
        mobile_number: mobileNumber,
        email,
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
        {
          success: false,
          message: "Unable to save booking.",
        },
        { status: 500 }
      );
    }

    const safe = {
      booking_id: escapeHtml(data.booking_number),
      customer_name: escapeHtml(customerName),
      mobile_number: escapeHtml(mobileNumber),
      customer_email: escapeHtml(email),
      event_category: escapeHtml(eventCategory),
      event_date: escapeHtml(eventDate),
      event_location: escapeHtml(eventLocation),
      event_description: escapeHtml(eventDescription),
      additional_requirements: escapeHtml(additionalRequirements),
    };

    let adminEmailSent = false;
    let customerEmailSent = false;

    // Admin notification email
    try {
      await sendEmailJS(
        process.env.EMAILJS_ADMIN_TEMPLATE_ID || "",
        safe
      );

      adminEmailSent = true;
      console.log("Admin email sent successfully.");
    } catch (emailError) {
      console.error("Admin email failed:", emailError);
    }

    // EmailJS rate limit protection
    await new Promise((resolve) => setTimeout(resolve, 1100));

    // Customer booking confirmation email
    try {
      await sendEmailJS(
        process.env.EMAILJS_CUSTOMER_TEMPLATE_ID || "",
        {
          to_email: email,
          customer_name: safe.customer_name,
          booking_id: safe.booking_id,
          event_category: safe.event_category,
          event_date: safe.event_date,
          event_location: safe.event_location,
        }
      );

      customerEmailSent = true;
      console.log("Customer email sent successfully.");
    } catch (emailError) {
      console.error("Customer email failed:", emailError);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Booking submitted successfully.",
        booking_number: data.booking_number,
        adminEmailSent,
        customerEmailSent,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Booking API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to process booking.",
      },
      { status: 500 }
    );
  }
}
