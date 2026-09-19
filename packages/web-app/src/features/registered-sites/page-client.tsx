"use client";

import type { RegisteredSitePageData } from "./common/types";
import { useRegisteredSites } from "./hooks/use-registered-sites";
import RegisteredSitesView from "./ui/RegisteredSitesView";

type Props = RegisteredSitePageData & { userId: string };

export default function RegisteredSitesPageClient(props: Props) {
  const { userId } = props;
  const viewProps = useRegisteredSites(props);
  return <RegisteredSitesView userId={userId} {...viewProps} />;
}
