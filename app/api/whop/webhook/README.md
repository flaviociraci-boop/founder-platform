# Whop Webhook Endpoint

Empfängt Whop-Webhook-Events und synchronisiert die `subscriptions`-Tabelle.

## Endpoint

```
POST https://connectyfind.com/api/whop/webhook
```

URL ist **unverändert** zum vorherigen Setup — keine Whop-Dashboard-Anpassung
nötig. Falls der Endpoint im Whop-Dashboard noch nicht eingetragen ist:
**Settings → Developer → Webhooks → Add Endpoint** und obige URL eintragen.

## Signaturverifizierung — Standard Webhooks v1

Implementiert die [Standard Webhooks v1](https://www.standardwebhooks.com/)
Spezifikation, wie sie Whop verwendet.

Erwartete Request-Header:

| Header               | Inhalt                                           |
| -------------------- | ------------------------------------------------ |
| `webhook-id`         | Eindeutige Event-ID                              |
| `webhook-timestamp`  | Unix-Sekunden (Replay-Schutz: ±300 s Toleranz)   |
| `webhook-signature`  | `v1,<base64-sig>` — mehrere durch Leerzeichen getrennt |

Algorithmus:

1. `signedContent = "${webhook-id}.${webhook-timestamp}.${rawBody}"`
2. HMAC-SHA256 über `signedContent`, Key = base64-dekodierter Teil hinter
   dem `ws_`-Prefix von `WHOP_WEBHOOK_SECRET`
3. Base64-encoded Output wird mit jeder `v1,...`-Signatur aus dem Header
   verglichen (timing-safe). Ein Match reicht.

Fehlende oder ungültige Signatur → **401**. Timestamp außerhalb der Toleranz
→ ebenfalls **401** (Replay-Schutz).

## Environment Variables

Müssen in Vercel gesetzt sein:

| Variable                          | Zweck                                              |
| --------------------------------- | -------------------------------------------------- |
| `WHOP_WEBHOOK_SECRET`             | Secret aus Whop-Dashboard, Format `ws_<base64>`    |
| `WHOP_MONTHLY_PLAN_ID`            | Whop Plan-ID für Mapping → `plan_type='monthly'`   |
| `WHOP_YEARLY_PLAN_ID`             | Whop Plan-ID für Mapping → `plan_type='yearly'`    |
| `NEXT_PUBLIC_SUPABASE_URL`        | Supabase-Projekt-URL                               |
| `SUPABASE_SERVICE_ROLE_KEY`       | Admin-Key (umgeht RLS) — **niemals client-side!**  |

## Behandelte Events

| Whop Action                                       | DB-Aktion                                                                |
| ------------------------------------------------- | ------------------------------------------------------------------------ |
| `payment_succeeded`                               | UPSERT auf `whop_membership_id`; `status='active'`; Period-Daten gesetzt |
| `payment_failed`                                  | Falls Row existiert: `status='past_due'`, sonst nur Warning              |
| `payment_created`                                 | Nur Logging (rein informativ — kein DB-Write)                            |
| `membership_activated` / `membership_went_valid`  | UPSERT; `status='trial'` wenn `trial_end` vorhanden, sonst `'active'`    |
| `membership_deactivated` / `membership_went_invalid` | `status='expired'`                                                    |
| `membership_cancel_at_period_end_change(d)`       | `canceled_at = now()` falls `true`, sonst `NULL`. Status bleibt aktiv.   |
| _alles andere_                                    | 200, Warning-Log, kein DB-Write (kein Retry sinnvoll)                    |

Event-Namen werden vor dem Vergleich normalisiert (`lowercase`, Bindestriche →
Underscores), damit Variationen zwischen Whop-API-Versionen abgefangen werden.

## Response-Codes

| Code | Wann                                                                 |
| ---- | -------------------------------------------------------------------- |
| 200  | Event verarbeitet (auch unbekannte Events, um Retry-Schleifen zu vermeiden) |
| 400  | Body unleserlich oder kein gültiges JSON                             |
| 401  | Signaturheader fehlen, ungültige Signatur, Timestamp außerhalb 5 min |
| 413  | Body > 1 MB                                                          |
| 500  | DB-Fehler oder fehlende Server-Konfiguration → Whop wird retrien     |

## Test-Anleitung

### 1) Whop-Dashboard-Test

Whop-Dashboard → **Webhooks → Endpoint öffnen → "Send Test Event"**.
Vor diesem Fix: 401 *Invalid signature*. Nach diesem Fix: **200 received**.

### 2) Lokaler Test mit Whop-CLI / -Forwarding

```bash
# Lokalen Dev-Server starten
npm run dev

# In zweitem Terminal Whop-Events via ngrok o.ä. forwarden auf:
#   http://localhost:3000/api/whop/webhook
```

### 3) cURL-Smoke-Test (ohne Whop-CLI)

Ohne gültige Signatur — erwartete Antwort `401 Invalid signature`:

```bash
curl -i -X POST https://connectyfind.com/api/whop/webhook \
  -H "Content-Type: application/json" \
  -H "webhook-id: msg_test_123" \
  -H "webhook-timestamp: $(date +%s)" \
  -H "webhook-signature: v1,bogus" \
  -d '{"action":"payment_succeeded","data":{"id":"pay_test"}}'
```

Für einen Test **mit** gültiger Signatur sollte das Whop-Dashboard
verwendet werden — eine manuelle HMAC-Berechnung erfordert den
base64-dekodierten Secret-Key, was leicht fehlerträchtig ist.

## Vercel-Log-Filter

Alle Log-Zeilen aus diesem Endpoint sind mit dem Prefix **`WHOP_WEBHOOK:`**
versehen — in Vercel unter *Project → Logs → Filter* danach filtern.

## DB-Schema

`subscriptions.user_id` ist seit der Migration
`20260512000000_subscriptions_nullable_user.sql` **nullable**. Der Webhook
schreibt Subscriptions ohne `user_id` ein; die Verknüpfung erfolgt in
Etappe 2 beim Register-Flow.

Status-Werte, die der Endpoint setzt:
`pending` (default) · `trial` · `active` · `past_due` · `canceled` · `expired`.
Spelling **`canceled`** (amerikanisch), konsistent mit dem restlichen Code.
