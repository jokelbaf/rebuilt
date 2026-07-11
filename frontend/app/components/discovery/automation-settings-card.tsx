import { Clock3, Search } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { useStartDiscoveryRun, useUpdateDiscoverySettings } from "~/lib/api/discovery";
import type {
	DiscoveryExchangeRates,
	DiscoveryRun,
	DiscoverySettings,
} from "~/lib/api/types/discovery";
import { formatDateTime, parseApiDate } from "~/lib/format";

import { INTERVALS, SUPPORTED_CURRENCIES } from "./settings-options";

interface AutomationSettingsCardProps {
	settings: DiscoverySettings;
	rates?: DiscoveryExchangeRates;
	runs: DiscoveryRun[];
}

export function AutomationSettingsCard({ settings, rates, runs }: AutomationSettingsCardProps) {
	const form = useForm<DiscoverySettings>({ defaultValues: settings });
	const updateSettings = useUpdateDiscoverySettings();
	const startRun = useStartDiscoveryRun();
	const activeRun = runs.find((run) => run.status === "running");
	const lastRun = runs.find((run) => run.status === "completed");
	const enabled = useWatch({ control: form.control, name: "enabled" });
	const interval = useWatch({ control: form.control, name: "intervalMinutes" });

	function submit(values: DiscoverySettings) {
		updateSettings.mutate(
			{ ...values, notifications: settings.notifications },
			{ onSuccess: () => toast.success("Automation settings saved") }
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Automation & display</CardTitle>
			</CardHeader>
			<CardContent>
				<form onSubmit={form.handleSubmit(submit)} className="space-y-5">
					<div className="flex items-start justify-between gap-4 rounded-lg border p-3">
						<div>
							<Label htmlFor="automation-enabled">Automatic discovery</Label>
							<p className="mt-1 text-xs text-muted-foreground">
								Searches run only while ReBuilt is open.
							</p>
						</div>
						<Controller
							control={form.control}
							name="enabled"
							render={({ field }) => (
								<Switch
									id="automation-enabled"
									checked={field.value}
									onCheckedChange={field.onChange}
								/>
							)}
						/>
					</div>
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-2">
							<Label>Search interval</Label>
							<Controller
								control={form.control}
								name="intervalMinutes"
								render={({ field }) => (
									<Select
										value={String(field.value)}
										onValueChange={(value) => field.onChange(Number(value))}
									>
										<SelectTrigger className="w-full">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{INTERVALS.map((option) => (
												<SelectItem
													key={option.value}
													value={String(option.value)}
												>
													{option.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								)}
							/>
						</div>
						<div className="space-y-2">
							<Label>Preferred currency</Label>
							<Controller
								control={form.control}
								name="preferredCurrency"
								render={({ field }) => (
									<Select value={field.value} onValueChange={field.onChange}>
										<SelectTrigger className="w-full">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{SUPPORTED_CURRENCIES.map((currency) => (
												<SelectItem key={currency} value={currency}>
													{currency}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								)}
							/>
							<p className="text-xs text-muted-foreground">
								{rates?.fetchedAt
									? `Rates updated ${formatDateTime(rates.fetchedAt)}`
									: "Exchange rates have not been fetched yet."}
							</p>
						</div>
					</div>
					<div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/50 p-3 text-sm">
						<div className="flex items-start gap-2">
							<Clock3 className="mt-0.5 size-4 text-muted-foreground" />
							<div>
								<div>
									{lastRun
										? `Last run ${formatDateTime(lastRun.finishedAt ?? lastRun.startedAt)}`
										: "No discovery runs yet"}
								</div>
								<div className="text-xs text-muted-foreground">
									{enabled
										? `Next check ${nextRunLabel(lastRun, interval)}`
										: "Automatic discovery is disabled"}
								</div>
							</div>
						</div>
						<Button
							type="button"
							variant="outline"
							size="sm"
							disabled={Boolean(activeRun) || startRun.isPending}
							onClick={() =>
								startRun.mutate(undefined, {
									onSuccess: () => toast.success("Discovery search started"),
								})
							}
						>
							<Search />
							{activeRun ? "Searching..." : "Search now"}
						</Button>
					</div>
					<div className="flex justify-end">
						<Button type="submit" disabled={updateSettings.isPending}>
							{updateSettings.isPending ? "Saving..." : "Save settings"}
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	);
}

function nextRunLabel(lastRun: DiscoveryRun | undefined, intervalMinutes: number) {
	if (!lastRun) return "when the scheduler checks next";
	return new Date(
		parseApiDate(lastRun.finishedAt ?? lastRun.startedAt).getTime() + intervalMinutes * 60_000
	).toLocaleString();
}
