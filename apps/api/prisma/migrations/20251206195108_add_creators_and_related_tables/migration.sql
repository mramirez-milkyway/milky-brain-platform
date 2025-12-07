-- CreateTable
CREATE TABLE "creators" (
    "id" SERIAL NOT NULL,
    "full_name" TEXT NOT NULL,
    "gender" TEXT,
    "country" TEXT,
    "city" TEXT,
    "email" TEXT,
    "phone_number" TEXT,
    "characteristics" TEXT,
    "past_clients" TEXT,
    "past_campaigns" TEXT,
    "comments" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "languages" TEXT,
    "categories" TEXT,
    "internal_tags" TEXT,
    "is_blacklisted" BOOLEAN NOT NULL DEFAULT false,
    "blacklist_reason" TEXT,
    "agency_name" TEXT,
    "manager_name" TEXT,
    "billing_info" TEXT,
    "last_brand" TEXT,
    "campaigns_active" INTEGER DEFAULT 0,
    "last_campaign_completed" TIMESTAMP(3),
    "last_fee" DECIMAL(10,2),
    "last_fee_date" TIMESTAMP(3),
    "last_fee_content_type" TEXT,
    "last_cpv" DOUBLE PRECISION,
    "last_cpm" DOUBLE PRECISION,
    "last_3_campaigns_perf" JSONB,
    "rate_source" TEXT,
    "internal_rating" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "creators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creator_socials" (
    "id" SERIAL NOT NULL,
    "creator_id" INTEGER NOT NULL,
    "social_media" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "followers" INTEGER,
    "tier" TEXT,
    "social_link" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "creator_socials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creator_social_audience_ages" (
    "id" SERIAL NOT NULL,
    "creator_social_id" INTEGER NOT NULL,
    "engagement_rate" DECIMAL(5,2),
    "pct_women" DECIMAL(5,2),
    "pct_men" DECIMAL(5,2),
    "pct_age_18_24" DECIMAL(5,2),
    "pct_age_25_34" DECIMAL(5,2),
    "pct_age_35_44" DECIMAL(5,2),
    "pct_age_45_54" DECIMAL(5,2),
    "pct_age_55_64" DECIMAL(5,2),
    "pct_age_65_plus" DECIMAL(5,2),
    "followers_credibility" DECIMAL(5,2),
    "data_source" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "creator_social_audience_ages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creator_social_audience_countries" (
    "id" SERIAL NOT NULL,
    "creator_social_id" INTEGER NOT NULL,
    "rank" INTEGER,
    "country" TEXT,
    "pct" DECIMAL(5,2),
    "city" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "creator_social_audience_countries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creator_social_audience_cities" (
    "id" SERIAL NOT NULL,
    "creator_social_id" INTEGER NOT NULL,
    "rank" INTEGER,
    "pct" DECIMAL(5,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "creator_social_audience_cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_stats_ig_posts" (
    "id" SERIAL NOT NULL,
    "creator_social_id" INTEGER NOT NULL,
    "avg_likes" INTEGER,
    "avg_comments" INTEGER,
    "avg_shares" INTEGER,
    "avg_impressions" INTEGER,
    "avg_saves" INTEGER,
    "impressions" INTEGER,
    "est_reach" INTEGER,
    "cpe" DOUBLE PRECISION,
    "cpc" DOUBLE PRECISION,
    "cpm" DOUBLE PRECISION,
    "data_source" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "social_stats_ig_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_stats_ig_stories" (
    "id" SERIAL NOT NULL,
    "creator_social_id" INTEGER NOT NULL,
    "avg_views" INTEGER,
    "link_clicks" INTEGER,
    "eng_rate" DOUBLE PRECISION,
    "impressions" INTEGER,
    "growth_source" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "social_stats_ig_stories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_stats_ig_reels" (
    "id" SERIAL NOT NULL,
    "creator_social_id" INTEGER NOT NULL,
    "avg_views" INTEGER,
    "avg_plays" INTEGER,
    "avg_likes" INTEGER,
    "engagements" INTEGER,
    "eng_rate" DOUBLE PRECISION,
    "est_reach" INTEGER,
    "cpm" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "social_stats_ig_reels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_stats_tt_videos" (
    "id" SERIAL NOT NULL,
    "creator_social_id" INTEGER NOT NULL,
    "avg_likes" INTEGER,
    "avg_comments" INTEGER,
    "avg_shares" INTEGER,
    "avg_saves" INTEGER,
    "est_views" INTEGER,
    "avg_view_rate" DOUBLE PRECISION,
    "est_cpv" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "social_stats_tt_videos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "budget" DECIMAL(10,2),
    "currency_code" TEXT DEFAULT 'USD',
    "status" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "industry" TEXT,
    "country" TEXT,
    "contact_name" TEXT,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_creators" (
    "id" SERIAL NOT NULL,
    "campaign_id" INTEGER NOT NULL,
    "creator_social_id" INTEGER NOT NULL,
    "status" TEXT,
    "content_cost" DECIMAL(10,2),
    "content_media_cost" DECIMAL(10,2),
    "event_cost" DECIMAL(10,2),
    "currency_code" TEXT DEFAULT 'USD',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "creatorId" INTEGER,

    CONSTRAINT "campaign_creators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" SERIAL NOT NULL,
    "campaign_creator_id" INTEGER NOT NULL,
    "post_url" TEXT,
    "content_type" TEXT,
    "published_at" TIMESTAMP(3),
    "views" INTEGER,
    "reach" INTEGER,
    "likes" INTEGER,
    "comments" INTEGER,
    "saves" INTEGER,
    "shares" INTEGER,
    "clicks_link" INTEGER,
    "cost" DECIMAL(10,2),
    "currency_code" TEXT DEFAULT 'USD',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "creators_full_name_idx" ON "creators"("full_name");

-- CreateIndex
CREATE INDEX "creators_email_idx" ON "creators"("email");

-- CreateIndex
CREATE INDEX "creators_is_active_idx" ON "creators"("is_active");

-- CreateIndex
CREATE INDEX "creators_is_blacklisted_idx" ON "creators"("is_blacklisted");

-- CreateIndex
CREATE INDEX "creator_socials_creator_id_idx" ON "creator_socials"("creator_id");

-- CreateIndex
CREATE INDEX "creator_socials_social_media_idx" ON "creator_socials"("social_media");

-- CreateIndex
CREATE INDEX "creator_socials_handle_idx" ON "creator_socials"("handle");

-- CreateIndex
CREATE UNIQUE INDEX "creator_socials_handle_social_media_key" ON "creator_socials"("handle", "social_media");

-- CreateIndex
CREATE INDEX "creator_social_audience_ages_creator_social_id_idx" ON "creator_social_audience_ages"("creator_social_id");

-- CreateIndex
CREATE INDEX "creator_social_audience_countries_creator_social_id_idx" ON "creator_social_audience_countries"("creator_social_id");

-- CreateIndex
CREATE INDEX "creator_social_audience_cities_creator_social_id_idx" ON "creator_social_audience_cities"("creator_social_id");

-- CreateIndex
CREATE INDEX "social_stats_ig_posts_creator_social_id_idx" ON "social_stats_ig_posts"("creator_social_id");

-- CreateIndex
CREATE INDEX "social_stats_ig_stories_creator_social_id_idx" ON "social_stats_ig_stories"("creator_social_id");

-- CreateIndex
CREATE INDEX "social_stats_ig_reels_creator_social_id_idx" ON "social_stats_ig_reels"("creator_social_id");

-- CreateIndex
CREATE INDEX "social_stats_tt_videos_creator_social_id_idx" ON "social_stats_tt_videos"("creator_social_id");

-- CreateIndex
CREATE INDEX "campaigns_customer_id_idx" ON "campaigns"("customer_id");

-- CreateIndex
CREATE INDEX "campaigns_status_idx" ON "campaigns"("status");

-- CreateIndex
CREATE INDEX "campaign_creators_campaign_id_idx" ON "campaign_creators"("campaign_id");

-- CreateIndex
CREATE INDEX "campaign_creators_creator_social_id_idx" ON "campaign_creators"("creator_social_id");

-- CreateIndex
CREATE INDEX "posts_campaign_creator_id_idx" ON "posts"("campaign_creator_id");

-- AddForeignKey
ALTER TABLE "creator_socials" ADD CONSTRAINT "creator_socials_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_social_audience_ages" ADD CONSTRAINT "creator_social_audience_ages_creator_social_id_fkey" FOREIGN KEY ("creator_social_id") REFERENCES "creator_socials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_social_audience_countries" ADD CONSTRAINT "creator_social_audience_countries_creator_social_id_fkey" FOREIGN KEY ("creator_social_id") REFERENCES "creator_socials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_social_audience_cities" ADD CONSTRAINT "creator_social_audience_cities_creator_social_id_fkey" FOREIGN KEY ("creator_social_id") REFERENCES "creator_socials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_stats_ig_posts" ADD CONSTRAINT "social_stats_ig_posts_creator_social_id_fkey" FOREIGN KEY ("creator_social_id") REFERENCES "creator_socials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_stats_ig_stories" ADD CONSTRAINT "social_stats_ig_stories_creator_social_id_fkey" FOREIGN KEY ("creator_social_id") REFERENCES "creator_socials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_stats_ig_reels" ADD CONSTRAINT "social_stats_ig_reels_creator_social_id_fkey" FOREIGN KEY ("creator_social_id") REFERENCES "creator_socials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_stats_tt_videos" ADD CONSTRAINT "social_stats_tt_videos_creator_social_id_fkey" FOREIGN KEY ("creator_social_id") REFERENCES "creator_socials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_creators" ADD CONSTRAINT "campaign_creators_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_creators" ADD CONSTRAINT "campaign_creators_creator_social_id_fkey" FOREIGN KEY ("creator_social_id") REFERENCES "creator_socials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_creators" ADD CONSTRAINT "campaign_creators_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "creators"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_campaign_creator_id_fkey" FOREIGN KEY ("campaign_creator_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
