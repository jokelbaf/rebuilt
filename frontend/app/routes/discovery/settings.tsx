import { ErrorState, LoadingState } from "~/components/common/states";
import { AccountsSection } from "~/components/discovery/accounts-section";
import { AutomationSettingsCard } from "~/components/discovery/automation-settings-card";
import { NotificationsCard } from "~/components/discovery/notifications-card";
import { SearchQueriesSection } from "~/components/discovery/search-queries-section";
import { PageBody, PageHeader, PageTransition } from "~/components/layout/page";
import { useDelayedFlag } from "~/hooks/use-delayed-flag";
import {
	useDiscoveryExchangeRates,
	useDiscoveryRuns,
	useDiscoverySettings,
} from "~/lib/api/discovery";

export default function DiscoverySettingsPage() {
	const settingsQuery = useDiscoverySettings();
	const ratesQuery = useDiscoveryExchangeRates();
	const runsQuery = useDiscoveryRuns(20);
	const hasError = settingsQuery.isError || ratesQuery.isError || runsQuery.isError;
	const error = settingsQuery.error ?? ratesQuery.error ?? runsQuery.error;
	const showLoading = useDelayedFlag(settingsQuery.isLoading);

	return (
		<>
			<PageHeader
				title="Search settings"
				description="Queries, accounts, automation, and notifications."
			/>
			<PageTransition>
				<PageBody className="max-w-6xl space-y-8">
					{showLoading && <LoadingState label="Loading discovery settings..." />}
					{hasError && (
						<ErrorState
							error={error}
							onRetry={() => {
								settingsQuery.refetch();
								ratesQuery.refetch();
								runsQuery.refetch();
							}}
							title="Couldn't load discovery settings"
						/>
					)}
					{settingsQuery.data && !hasError && (
						<>
							<SearchQueriesSection />
							<AutomationSettingsCard
								settings={settingsQuery.data}
								rates={ratesQuery.data}
								runs={runsQuery.data ?? []}
							/>
							<AccountsSection />
							<NotificationsCard settings={settingsQuery.data} />
						</>
					)}
				</PageBody>
			</PageTransition>
		</>
	);
}
