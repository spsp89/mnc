import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

@Injectable()
export class FirebasePushService {
  readonly configured: boolean;

  constructor(private readonly config: ConfigService) {
    const raw = config.get<string>("FIREBASE_SERVICE_ACCOUNT_JSON");
    if (!raw) {
      this.configured = false;
      return;
    }
    try {
      if (!getApps().length) {
        const serviceAccount = JSON.parse(raw) as {
          project_id: string;
          client_email: string;
          private_key: string;
        };
        initializeApp({
          credential: cert({
            projectId: serviceAccount.project_id,
            clientEmail: serviceAccount.client_email,
            privateKey: serviceAccount.private_key,
          }),
        });
      }
      this.configured = true;
    } catch {
      this.configured = false;
    }
  }

  async send(input: {
    token: string;
    title: string;
    body: string;
    data: Record<string, string>;
  }) {
    if (!this.configured) throw new Error("Firebase push credentials are not configured.");
    return getMessaging().send({
      token: input.token,
      notification: { title: input.title, body: input.body },
      data: input.data,
      android: {
        priority: "high",
        notification: { channelId: "bnc_updates", sound: "default" },
      },
      apns: {
        headers: { "apns-priority": "10" },
        payload: { aps: { sound: "default", contentAvailable: true } },
      },
    });
  }
}
