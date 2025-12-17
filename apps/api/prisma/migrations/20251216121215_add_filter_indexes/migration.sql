-- CreateIndex
CREATE INDEX "creator_socials_followers_idx" ON "creator_socials"("followers");

-- CreateIndex
CREATE INDEX "creator_socials_social_media_creator_id_idx" ON "creator_socials"("social_media", "creator_id");

-- CreateIndex
CREATE INDEX "creator_socials_social_media_followers_idx" ON "creator_socials"("social_media", "followers");

-- CreateIndex
CREATE INDEX "creators_country_idx" ON "creators"("country");

-- CreateIndex
CREATE INDEX "creators_gender_idx" ON "creators"("gender");

-- CreateIndex
CREATE INDEX "creators_internal_rating_idx" ON "creators"("internal_rating");

-- CreateIndex
CREATE INDEX "creators_is_blacklisted_country_gender_idx" ON "creators"("is_blacklisted", "country", "gender");
