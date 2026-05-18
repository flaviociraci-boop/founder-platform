// Onboarding-Hinweisbox für Tabs. Lila Border + Lightbulb-Icon links,
// Fließtext rechts. Verwendet u.a. in MatchScreen (Connect-Tab) und
// ProjectBoard (Projekt-Tab). Margin ist Teil der Component, damit das
// Spacing zwischen den Tabs garantiert identisch ist.

import { Lightbulb } from "lucide-react";

type Props = {
  children: React.ReactNode;
};

export default function InfoBox({ children }: Props) {
  return (
    <div
      style={{
        margin: "0 20px 20px",
        background: "rgba(99,102,241,0.08)",
        border: "1px solid rgba(99,102,241,0.2)",
        borderRadius: 16,
        padding: "14px 16px",
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
      }}
    >
      <Lightbulb size={20} color="#694CBB" strokeWidth={2} style={{ flexShrink: 0 }} />
      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>
        {children}
      </div>
    </div>
  );
}
