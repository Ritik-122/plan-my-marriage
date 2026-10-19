import "server-only";
import { escapeHtml } from "@/lib/email/resend";
import type { GuestEmailContent } from "./email-dto";
export function renderGuestEmail(content: GuestEmailContent, url: string) {
  const e = escapeHtml;
  const expiry = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "long",
    timeZone: "Asia/Kolkata",
  }).format(new Date(content.expiresAt));
  const footer = `This invitation is personal to you. Please do not forward it. Your private link expires on ${expiry} (IST). No account is required to RSVP.`;
  const schedule = content.events.length
    ? content.events
        .map((event) => `${event.name}\n${event.when}\n${event.venue}`)
        .join("\n\n")
    : "Your hosts will share the celebration schedule soon.";
  const text = `${content.couple}\n${content.weddingDate} · ${content.city}\n\n${content.greeting}\n${content.introduction}\n\nYour celebrations\n${schedule}\n\nView your private invitation & RSVP: ${url}\n\n${footer}`;
  const html = `<!doctype html><html><body style="margin:0;background:#fff8f5;color:#302124;font-family:Arial,sans-serif"><div style="max-width:600px;margin:0 auto;padding:32px 24px"><p style="text-align:center;letter-spacing:3px;font-size:12px">PLAN MY MARRIAGE</p><h1 style="text-align:center;color:#681b30;font-family:Georgia,serif">${e(content.couple)}</h1><p style="text-align:center">${e(content.weddingDate)} · ${e(content.city)}</p><div style="background:#fff;padding:24px;border-radius:12px"><p>${e(content.greeting)}</p><p style="line-height:1.6">${e(content.introduction)}</p><h2 style="font-size:14px;color:#681b30">YOUR CELEBRATIONS</h2>${content.events.length ? content.events.map((event) => `<div style="background:#faf1ed;padding:16px;margin:12px 0;border-radius:8px"><strong>${e(event.name)}</strong><p>${e(event.when)}</p><p>${e(event.venue)}</p></div>`).join("") : `<p>${e(schedule)}</p>`}<p style="text-align:center;margin:28px 0"><a href="${e(url)}" style="display:inline-block;background:#681b30;color:#fff;text-decoration:none;padding:16px 20px;border-radius:6px">View your private invitation &amp; RSVP</a></p><p style="font-size:12px;line-height:1.6;color:#67595c">${e(footer)}</p></div></div></body></html>`;
  return { text, html };
}
