"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Bell } from "lucide-react";

// Strukturell fertig. Der echte iOS-Push-Permission-Call wird in einem
// späteren Schritt hinzugefügt — siehe TODO im handleAllow-Body.
//
// UX-Fluss:
//  1. Register-Form (App-Kontext) → push('/onboarding/notifications?email=…').
//  2. Diese Seite: "Prüfe deine E-Mails" (DOI-Hinweis) + Push-Ask.
//  3. Beide Buttons ("Erlauben"/"Später") → router.replace('/'). Wenn
//     die Bestätigungsmail noch nicht geklickt wurde, bringt die
//     Middleware den User zurück auf /register — das ist ein bewusster
//     Loop-Schutz und wird beim späteren Push-Setup gemeinsam mit dem
//     Deep-Link aus der Bestätigungsmail sauber abgehandelt.

function NotificationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [busy, setBusy] = useState(false);

  const goToApp = () => router.replace("/");

  const handleAllow = async () => {
    if (busy) return;
    setBusy(true);
    // TODO(push): echten Push-Permission-Call via @capacitor/push-notifications
    //   (register-Aufruf + iOS-Native-Dialog) hier verdrahten. Aktuell
    //   nur strukturell — nach Klick geht's direkt in die App.
    goToApp();
  };

  const handleLater = () => {
    if (busy) return;
    goToApp();
  };

  return (
    <div style={{
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      background: "#0a0a0f", minHeight: "100vh", color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Image
            src="/connectyfind-logo-light.svg"
            alt="Connectyfind"
            width={40}
            height={40}
            style={{ borderRadius: 12, margin: "0 auto 12px", display: "block" }}
            quality={100}
          />
        </div>

        <div style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 24,
          padding: 28,
        }}>
          {/* Icon */}
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            margin: "0 auto 20px",
            background: "rgba(105,76,187,0.16)",
            border: "1px solid rgba(105,76,187,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Bell size={30} color="#fff" strokeWidth={1.8} />
          </div>

          <h1 style={{
            margin: "0 0 8px", fontSize: 20, fontWeight: 800, textAlign: "center",
          }}>
            Benachrichtigungen erlauben
          </h1>
          <p style={{
            margin: "0 0 20px", fontSize: 14, color: "rgba(255,255,255,0.6)",
            textAlign: "center", lineHeight: 1.6,
          }}>
            Bekomm mit, wenn ein Match zurückschreibt oder deine Bewerbung
            angenommen wird — auch wenn Connectyfind gerade nicht offen ist.
          </p>

          {/* DOI-Hinweis: der User hat gerade registriert und muss noch
              die Bestätigungsmail bestätigen. Prominente Info, damit er
              nicht die Push-Ask wegtippt und dann auf dem Landing-Screen
              hängen bleibt weil sein Account noch nicht confirmed ist. */}
          {email && (
            <div style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12,
              padding: "12px 14px",
              marginBottom: 20,
              fontSize: 12.5, color: "rgba(255,255,255,0.6)", lineHeight: 1.5,
            }}>
              <div style={{ color: "#f59e0b", fontWeight: 700, marginBottom: 4 }}>
                Prüfe deine E-Mails
              </div>
              <div>
                Wir haben dir einen Bestätigungslink an{" "}
                <strong style={{ color: "#fff" }}>{email}</strong> geschickt.
                Klick drauf, um deinen Account zu aktivieren.
              </div>
            </div>
          )}

          <button
            onClick={handleAllow}
            disabled={busy}
            style={{
              width: "100%", padding: "14px 0", borderRadius: 14,
              background: "#694CBB",
              border: "1px solid #694CBB",
              color: "#fff", fontWeight: 700, fontSize: 15,
              cursor: busy ? "default" : "pointer",
              marginBottom: 10,
            }}
          >
            {busy ? "…" : "Erlauben"}
          </button>
          <button
            onClick={handleLater}
            disabled={busy}
            style={{
              width: "100%", padding: "13px 0", borderRadius: 14,
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.7)", fontWeight: 600, fontSize: 14,
              cursor: busy ? "default" : "pointer",
            }}
          >
            Später
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingNotificationsPage() {
  return (
    <Suspense fallback={null}>
      <NotificationsContent />
    </Suspense>
  );
}
