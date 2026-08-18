import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import path from "node:path";
import { AdminModule } from "./modules/admin/admin.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { AuthModule } from "./modules/auth/auth.module";
import { BusinessesModule } from "./modules/businesses/businesses.module";
import { CategoriesModule } from "./modules/categories/categories.module";
import { ConversationsModule } from "./modules/conversations/conversations.module";
import { EnquiriesModule } from "./modules/enquiries/enquiries.module";
import { HealthModule } from "./modules/health/health.module";
import { LeadsModule } from "./modules/leads/leads.module";
import { JobsModule } from "./modules/jobs/jobs.module";
import { LocationsModule } from "./modules/locations/locations.module";
import { MediaModule } from "./modules/media/media.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { OffersModule } from "./modules/offers/offers.module";
import { OrdersModule } from "./modules/orders/orders.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { ProductsModule } from "./modules/products/products.module";
import { ReviewsModule } from "./modules/reviews/reviews.module";
import { SearchModule } from "./modules/search/search.module";
import { ServicesModule } from "./modules/services/services.module";
import { SubscriptionsModule } from "./modules/subscriptions/subscriptions.module";
import { UsersModule } from "./modules/users/users.module";
import { VerificationModule } from "./modules/verification/verification.module";
import { DatabaseModule } from "./database/database.module";
import { RedisModule } from "./infrastructure/redis.module";
import { environmentSchema } from "./config/environment";
import { CryptoModule } from "./common/crypto/crypto.module";
import { BusinessAccessModule } from "./common/auth/business-access.module";
import { WeeklyDrawsModule } from "./modules/weekly-draws/weekly-draws.module";
import { BusinessClubModule } from "./modules/business-club/business-club.module";
import { BookingsModule } from "./modules/bookings/bookings.module";
import { DeliveriesModule } from "./modules/deliveries/deliveries.module";
import { SupportModule } from "./modules/support/support.module";
import { PlanEntitlementsModule } from "./common/subscriptions/plan-entitlements.module";
import { ContentModule } from "./modules/content/content.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: [path.resolve(process.cwd(), ".env"), path.resolve(process.cwd(), "../../.env")],
      validate: (input) => environmentSchema.parse(input),
    }),
    ThrottlerModule.forRoot([
      { name: "short", ttl: 60_000, limit: 100 },
    ]),
    BullModule.forRootAsync({
      inject: [ConfigService],
      extraOptions: {
        manualRegistration: process.env.DISABLE_BACKGROUND_JOBS === "true",
      },
      useFactory: (config: ConfigService) => ({
        connection: {
          url: config.getOrThrow<string>("REDIS_URL"),
          maxRetriesPerRequest: null,
        },
        prefix: "bnc",
      }),
    }),
    DatabaseModule,
    RedisModule,
    CryptoModule,
    BusinessAccessModule,
    PlanEntitlementsModule,
    HealthModule,
    AuthModule,
    UsersModule,
    BusinessesModule,
    SearchModule,
    LocationsModule,
    CategoriesModule,
    MediaModule,
    ConversationsModule,
    ProductsModule,
    ServicesModule,
    LeadsModule,
    JobsModule,
    WeeklyDrawsModule,
    BusinessClubModule,
    BookingsModule,
    DeliveriesModule,
    EnquiriesModule,
    ReviewsModule,
    NotificationsModule,
    SubscriptionsModule,
    PaymentsModule,
    OrdersModule,
    OffersModule,
    AnalyticsModule,
    SupportModule,
    VerificationModule,
    AdminModule,
    ContentModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
