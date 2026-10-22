import Link from "next/link";
import type { PublicWebsiteDTO } from "@/modules/website/dto";
import { formatWeddingDate } from "@/modules/weddings/schema";
import { eventDate, eventTime, typeNames } from "@/modules/events/schema";
import styles from "./guest-website.module.css";

export function GuestWebsite({ wedding }: { wedding: PublicWebsiteDTO }) {
  const modern = wedding.theme === "MODERN_MINIMAL";
  const venues = wedding.events.filter(
    (e) => e.venue.name || e.venue.address || e.venue.mapUrl,
  );
  return (
    <div
      className={`${styles.site} ${styles[wedding.theme]}`}
      data-theme={wedding.theme}
    >
      <header className={styles.header}>
        <a
          href="#celebration"
          className={styles.monogram}
          aria-label="Back to the celebration"
        >
          {wedding.brideName.slice(0, 1)} {modern ? "+" : "&"}{" "}
          {wedding.groomName.slice(0, 1)}
        </a>
        <nav aria-label="Wedding website navigation">
          <a href="#welcome">Welcome</a>
          <a href="#celebrations">Celebrations</a>
          {venues.length > 0 && <a href="#venues">Venues</a>}
          <a href="#your-invitation">Your invitation</a>
        </nav>
      </header>
      <main>
        <section id="celebration" className={styles.hero}>
          <p className={styles.eyebrow}>Together with our families</p>
          <h1>
            {wedding.brideName} <span>{modern ? "+" : "&"}</span>{" "}
            {wedding.groomName}
          </h1>
          <p className={styles.subtitle}>
            A celebration of love, family, and new beginnings.
          </p>
          <p className={styles.date}>
            <time dateTime={wedding.weddingDate}>
              {formatWeddingDate(wedding.weddingDate)}
            </time>
            <span aria-hidden="true">·</span>
            {wedding.city}
          </p>
          <div className={styles.arches} aria-hidden="true">
            <div className={styles.sideArch}>
              <span>✦</span>
            </div>
            <div className={styles.mainArch}>
              <div>
                <p>A new chapter</p>
                <span>
                  {wedding.brideName.slice(0, 1)} {modern ? "+" : "&"}{" "}
                  {wedding.groomName.slice(0, 1)}
                </span>
                <p>Our wedding celebration</p>
                <b>✦</b>
              </div>
            </div>
            <div className={styles.sideArch}>
              <span>✦</span>
            </div>
          </div>
        </section>
        <section id="welcome" className={styles.welcome}>
          <span aria-hidden="true" className={styles.ornament}>
            ✦
          </span>
          <h2>We can’t wait to celebrate with you</h2>
          <p>
            {wedding.description ||
              "Join us as we begin this beautiful chapter together. We look forward to sharing our wedding celebrations with you."}
          </p>
          <span className={styles.eyebrow}>
            With love, {wedding.brideName} &amp; {wedding.groomName}
          </span>
        </section>
        <section id="celebrations" className={styles.section}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Moments to share</p>
              <h2>The celebrations</h2>
            </div>
            <p>
              Dates, places, and details for our public celebrations. All times
              are in India Standard Time (IST).
            </p>
          </div>
          {wedding.events.length === 0 ? (
            <p className={styles.empty}>
              Celebration details will be shared here soon. If you received a
              personal invitation, please check your invitation link for your
              schedule.
            </p>
          ) : (
            wedding.events.map((e) => (
              <article key={e.id} className={styles.event}>
                <div>
                  <p className={styles.tag}>{typeNames[e.type]}</p>
                  <h3>{e.name}</h3>
                  <div className={styles.eventMeta}>
                    <p>
                      <time dateTime={e.startsAt}>{eventDate(e.startsAt)}</time>
                    </p>
                    <p>
                      {eventTime(e.startsAt)}
                      {e.endsAt
                        ? ` – ${eventDate(e.endsAt) !== eventDate(e.startsAt) ? eventDate(e.endsAt) + ", " : ""}${eventTime(e.endsAt)}`
                        : ""}{" "}
                      IST
                    </p>
                    {e.dressCode && (
                      <p className={styles.dress}>
                        <b>Dress code</b>
                        <br />
                        {e.dressCode}
                      </p>
                    )}
                  </div>
                </div>
                <div className={styles.eventDescription}>
                  {e.description && <p>{e.description}</p>}
                  <div className={styles.venueInfo}>
                    <p className={styles.eyebrow}>Venue</p>
                    <h4>{e.venue.name || "Venue details to follow"}</h4>
                    {e.venue.address && <p>{e.venue.address}</p>}
                    {e.venue.mapUrl && (
                      <a
                        className={styles.button}
                        href={e.venue.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View map <span aria-hidden="true">↗</span>
                        <span className="sr-only"> (opens in a new tab)</span>
                      </a>
                    )}
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
        {venues.length > 0 && (
          <section id="venues" className={styles.venues}>
            <div className={styles.section}>
              <p className={styles.eyebrow}>Finding your way</p>
              <h2>Venues in {wedding.city}</h2>
              <div className={styles.venueGrid}>
                {venues.map((e) => (
                  <article key={e.id}>
                    <span aria-hidden="true" className={styles.ornament}>
                      ⌖
                    </span>
                    <h3>{e.venue.name || e.name}</h3>
                    <p className={styles.tag}>{e.name}</p>
                    {e.venue.address && <p>{e.venue.address}</p>}
                    {e.venue.mapUrl && (
                      <a
                        href={e.venue.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View map ↗
                        <span className="sr-only"> (opens in a new tab)</span>
                      </a>
                    )}
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}
        <section id="your-invitation" className={styles.invitation}>
          <span aria-hidden="true" className={styles.ornament}>
            ♡
          </span>
          <h2>Your personal invitation</h2>
          <p>
            For your invited events and RSVP, use the personalized invitation
            link shared with you by the couple. If you need your link, please
            contact them directly.
          </p>
        </section>
      </main>
      <footer className={styles.footer}>
        <h2>
          {wedding.brideName} &amp; {wedding.groomName}
        </h2>
        <p>
          {formatWeddingDate(wedding.weddingDate)} · {wedding.city}
        </p>
        <Link href="/">Made with Plan My Marriage</Link>
      </footer>
    </div>
  );
}
