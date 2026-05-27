import { SunsetPage } from "@/components/layout/sunset-page";
import HomePageLive from "@/app/home-live";
import { isSiteDeprecated } from "@/lib/site-status";

export default function HomePage() {
  if (isSiteDeprecated()) {
    return <SunsetPage />;
  }

  return <HomePageLive />;
}
