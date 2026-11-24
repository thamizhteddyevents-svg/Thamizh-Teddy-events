
'use client';

import { useState, type FormEvent } from "react";

const events = [
  ["Birthday Party", "பிறந்தநாள் விழா", "🎂"],
  ["Baby Shower", "வளைகாப்பு", "🍼"],
  ["Wedding", "திருமணம்", "💍"],
  ["Engagement", "நிச்சயதார்த்தம்", "🌸"],
  ["Naming Ceremony", "பெயர் சூட்டும் விழா", "🧸"],
  ["Anniversary", "திருமண நாள்", "❤️"],
  ["Corporate Events", "நிறுவன நிகழ்வுகள்", "✨"],
  ["Other Events", "மற்ற நிகழ்வுகள்", "🎉"],
];

export default function Home() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const bookingData = {
      customerName: String(formData.get("name") || "").trim(),
      mobileNumber: String(formData.get("phone") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      eventCategory: String(formData.get("category") || ""),
      eventDate: String(formData.get("date") || ""),
      eventLocation: String(formData.get("location") || "").trim(),
      eventDescription: String(formData.get("description") || "").trim(),
      additionalRequirements: String(formData.get("requirements") || "").trim(),
    };

    try {
      setLoading(true);

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        alert(result.message || "Booking failed. Please try again.");
        return;
      }

      setSent(true);

      alert(
        "Booking submitted successfully! Booking ID: " +
        result.booking_number
      );

    } catch (error) {
      console.error("Booking submission error:", error);
      alert("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#home">
          <span className="brand-mark">TT</span>
          <span>THAMIZH TEDDY <b>EVENTS</b></span>
        </a>

        <nav>
          <a href="#home">HOME</a>
          <a href="#about">ABOUT</a>
          <a href="#events">EVENTS</a>
          <a href="#gallery">GALLERY</a>
          <a href="#reviews">REVIEWS</a>
          <a className="nav-cta" href="#booking">BOOK NOW</a>
          <a href="#contact">CONTACT</a>
        </nav>
      </header>

      <section className="hero" id="home">
        <div className="hero-video">
          <video autoPlay muted loop playsInline poster="/poster.svg">
            <source src="/videos/teddy-dance.mp4" type="video/mp4" />
          </video>
          <div className="video-shade" />
        </div>

        <div className="hero-content">
          <p className="eyebrow">✦ EVERY MOMENT DESERVES MAGIC ✦</p>
          <h1>THAMIZH TEDDY<br /><span>EVENTS</span></h1>
          <p className="tamil-line">
            உங்கள் ஒவ்வொரு கொண்டாட்டத்தையும் மறக்க முடியாத நினைவாக மாற்றுகிறோம்!
          </p>
          <p className="tagline">Making Every Celebration Magical!</p>

          <div className="hero-actions">
            <a className="gold-button" href="#events">EXPLORE EVENTS</a>
            <a className="outline-button" href="#booking">BOOK NOW</a>
          </div>
        </div>

        <div className="scroll-note">
          SCROLL TO EXPLORE <span>↓</span>
        </div>
      </section>

      <section className="section intro" id="about">
        <p className="eyebrow">WELCOME TO OUR WORLD</p>
        <h2>Celebrations made <span>unforgettable.</span></h2>
        <p>
          உங்கள் மகிழ்ச்சியான தருணங்களுக்கு அழகான திட்டமிடல்,
          அன்பான சேவை மற்றும் சிறப்பான அலங்காரம்.
        </p>
      </section>

      <section className="section" id="events">
        <p className="eyebrow">WHAT WE CELEBRATE</p>
        <h2>Our <span>Events</span></h2>

        <div className="event-grid">
          {events.map(([name, tamil, emoji]) => (
            <article className="event-card" key={name}>
              <div className="event-icon">{emoji}</div>
              <h3>{name}</h3>
              <p>{tamil}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section gallery" id="gallery">
        <p className="eyebrow">A LITTLE INSPIRATION</p>
        <h2>Celebration <span>Gallery</span></h2>
        <p className="muted">
          Our event photos will be added here through the Admin Dashboard in a later setup step.
        </p>
        <div className="gallery-placeholder">
          <span>✦</span>
          <p>YOUR SPECIAL MOMENTS WILL SHINE HERE</p>
        </div>
      </section>

      <section className="section review" id="reviews">
        <p className="eyebrow">KIND WORDS</p>
        <h2>Customer <span>Reviews</span></h2>
        <p className="muted">
          Customer reviews will appear here after the review feature is connected.
        </p>
      </section>

      <section className="section booking" id="booking">
        <p className="eyebrow">LET'S PLAN SOMETHING BEAUTIFUL</p>
        <h2>Book Your <span>Event</span></h2>
        <p className="muted">
          உங்கள் நிகழ்வு விவரங்களை அனுப்புங்கள்.
          எங்கள் குழு உங்களைத் தொடர்புகொள்ளும்.
        </p>

        {sent ? (
          <div className="success-note">
            நன்றி! உங்கள் Booking Enquiry வெற்றிகரமாகப் பதிவு செய்யப்பட்டது.
            எங்கள் குழு விரைவில் உங்களைத் தொடர்புகொள்ளும்.
          </div>
        ) : (
          <form onSubmit={submitBooking}>
            <div className="form-grid">
              <label>
                Full Name
                <input required name="name" placeholder="Your name" />
              </label>

              <label>
                Mobile Number
                <input required name="phone" type="tel" placeholder="+91" />
              </label>

              <label>
                Email Address
                <input required name="email" type="email" placeholder="you@example.com" />
              </label>

              <label>
                Event Category
                <select required name="category" defaultValue="">
                  <option value="" disabled>Select event</option>
                  {events.map(([name]) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </label>

              <label>
                Event Date
                <input required name="date" type="date" />
              </label>

              <label>
                Event Location
                <input required name="location" placeholder="Town / venue / address" />
              </label>
            </div>

            <label>
              Event Description
              <textarea name="description" rows={4} placeholder="Tell us about your event..." />
            </label>

            <label>
              Additional Requirements
              <textarea name="requirements" rows={3} placeholder="Any special requests..." />
            </label>

            <button className="gold-button" type="submit" disabled={loading}>
              {loading ? "SUBMITTING..." : "SUBMIT BOOKING ENQUIRY"}
            </button>
          </form>
        )}
      </section>

      <footer id="contact">
        <div>
          <a className="brand footer-brand" href="#home">
            <span className="brand-mark">TT</span>
            <span>THAMIZH TEDDY <b>EVENTS</b></span>
          </a>
          <p>Making Every Celebration Magical!</p>
        </div>

        <div>
          <h3>CONTACT</h3>
          <p><a href="tel:+918940141780">+91 89401 41780</a></p>
          <p>
            <a href="mailto:thamizhteddyevents@gmail.com">
              thamizhteddyevents@gmail.com
            </a>
          </p>
          <p>Tamil Nadu & Puducherry – All Areas</p>
        </div>

        <p className="copyright">
          © {new Date().getFullYear()} Thamizh Teddy Events. All rights reserved.
        </p>
      </footer>
    </main>
  );
}
