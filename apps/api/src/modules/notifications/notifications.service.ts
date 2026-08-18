import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import type { NotificationPreferenceDto } from "./dto/notification-preference.dto";
import type { RegisterPushDeviceDto } from "./dto/push-device.dto";

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, unreadOnly = false, limit = 50) {
    const data = await this.prisma.notification.findMany({
      where: { userId, ...(unreadOnly ? { readAt: null } : {}) },
      orderBy: { createdAt: "desc" },
      take: Math.min(Math.max(limit, 1), 100),
    });
    const unread = await this.prisma.notification.count({ where: { userId, readAt: null } });
    return { data, meta: { unread } };
  }

  async markRead(userId: string, id: string) {
    const result = await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { readAt: new Date() },
    });
    return { data: { updated: result.count === 1 } };
  }

  async markAllRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { data: { updated: result.count } };
  }

  async preferences(userId: string) {
    const data = await this.prisma.notificationPreference.findMany({
      where: { userId },
      orderBy: { type: "asc" },
    });
    return { data };
  }

  async updatePreference(userId: string, input: NotificationPreferenceDto) {
    const { type, ...channels } = input;
    const data = await this.prisma.notificationPreference.upsert({
      where: { userId_type: { userId, type } },
      create: { userId, type, ...channels },
      update: channels,
    });
    return { data };
  }

  async registerDevice(userId: string, input: RegisterPushDeviceDto) {
    const data = await this.prisma.pushDevice.upsert({
      where: { token: input.token },
      create: {
        userId,
        token: input.token,
        platform: input.platform,
        deviceName: input.deviceName,
        appVersion: input.appVersion,
        active: true,
        lastSeenAt: new Date(),
      },
      update: {
        userId,
        platform: input.platform,
        deviceName: input.deviceName,
        appVersion: input.appVersion,
        active: true,
        lastSeenAt: new Date(),
      },
      select: { id: true, platform: true, active: true, lastSeenAt: true },
    });
    return { data };
  }

  async unregisterDevice(userId: string, token: string) {
    const result = await this.prisma.pushDevice.updateMany({
      where: { userId, token },
      data: { active: false, lastSeenAt: new Date() },
    });
    return { data: { updated: result.count === 1 } };
  }
}
